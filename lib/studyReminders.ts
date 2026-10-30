// Owns sending the daily flashcard reminder for one reminder time: every
// student who switched it on, chose this time, and has cards due today. The
// number in the email stops at the student's review limit, as the app does.
//
// It walks the opted-in students in pages ordered by id and stops at the
// caller's deadline rather than at a head-count, so a long list is finished in
// one run when there is time and never starves the same students every day.
// The chosen time is read from each row with prefsOf, not filtered in SQL: a
// row saved before times existed has no reminderHour key and must count as the
// default, which a JSON path filter cannot say.
//
// It deliberately does NOT check who called it; the cron routes do.

import { Prisma } from "@prisma/client";

import { sendStudyReminder } from "@/lib/emailNotices";
import { currentStreak } from "@/lib/freeze";
import { STREAK_MIN_XP } from "@/lib/streak";
import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";
import { istDayStart, servableDue } from "@/lib/srs";
import { reviewedTodaySql } from "@/lib/todayReview";

const PAGE = 100;
/// The streak line stops this long before the deadline, leaving time to send.
const STREAK_LINE_MARGIN_MS = 15_000;

export async function sendStudyReminders(hour: number, link: string, deadline: number): Promise<{ checked: number; sent: number }> {
  const now = new Date();
  let checked = 0;
  let sent = 0;
  let cursor: string | undefined;

  while (Date.now() < deadline) {
    const page = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        suspendedAt: null,
        email: { not: null },
        // An unproven address may belong to someone else; never mail it.
        emailVerified: { not: null },
        preferences: { path: ["emailReminder"], equals: true },
      },
      orderBy: { id: "asc" },
      take: PAGE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, email: true, preferences: true },
    });
    if (page.length === 0) break;
    cursor = page[page.length - 1].id;

    const mine = page.filter((s) => prefsOf(s.preferences).reminderHour === hour);
    checked += mine.length;
    if (mine.length === 0) continue;

    // One grouped count for the whole page instead of one query per student.
    // Per kind, with today's reviews, so the number in the email is what the
    // app will serve under the student's review limit (lib/todayReview).
    const dayStart = istDayStart(now);
    const rows = await prisma.$queryRaw<{ userId: string; due: number; reviewedToday: number }[]>(Prisma.sql`
      SELECT cs."userId" AS "userId",
             COUNT(*) FILTER (WHERE cs."dueAt" <= ${now})::int AS due,
             COUNT(*) FILTER (WHERE ${reviewedTodaySql(dayStart)})::int AS "reviewedToday"
      FROM "CardState" cs JOIN "Word" w ON w."id" = cs."wordId"
      WHERE cs."userId" IN (${Prisma.join(mine.map((s) => s.id))}) AND cs."reviews" > 0 AND w."deckId" IS NULL
        AND (cs."dueAt" <= ${now} OR cs."lastReviewedAt" >= ${dayStart})
      GROUP BY cs."userId", w."kind"`);

    for (const s of mine) {
      const prefs = prefsOf(s.preferences);
      const n = rows.filter((r) => r.userId === s.id).reduce((sum, r) => sum + servableDue(r.due, r.reviewedToday, prefs.reviewsPerDay), 0);
      if (n === 0 || !s.email) continue;
      try {
        // A streak line only for a streak worth keeping and not yet kept today.
        // Read per student, after the due check, so only those emailed pay for
        // it, and only while there is time: the line is a nicety, and the
        // reminder itself must not be cut off by the job's time limit.
        const st = Date.now() < deadline - STREAK_LINE_MARGIN_MS
          ? await currentStreak(s.id, prefs.dailyGoalXp, prefs.weeklyGoalDays, now).catch(() => null)
          : null;
        const keep = st && st.streak > 0 && st.todayXp < STREAK_MIN_XP ? st.streak : 0;
        await sendStudyReminder(s.email, n, link, keep);
        sent++;
      } catch (err) {
        // One bad address must not stop everyone after them.
        console.error("Reminder not sent", err instanceof Error ? err.message : "unknown error");
      }
    }
  }
  return { checked, sent };
}
