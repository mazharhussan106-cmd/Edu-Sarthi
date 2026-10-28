// Owns sending the daily flashcard reminder for one reminder time: every
// student who switched it on, chose this time, and has cards due today.
//
// It walks the opted-in students in pages ordered by id and stops at the
// caller's deadline rather than at a head-count, so a long list is finished in
// one run when there is time and never starves the same students every day.
// The chosen time is read from each row with prefsOf, not filtered in SQL: a
// row saved before times existed has no reminderHour key and must count as the
// default, which a JSON path filter cannot say.
//
// It deliberately does NOT check who called it; the cron routes do.

import { sendStudyReminder } from "@/lib/emailNotices";
import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";

const PAGE = 100;

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
    const due = await prisma.cardState.groupBy({
      by: ["userId"],
      where: { userId: { in: mine.map((s) => s.id) }, reviews: { gt: 0 }, dueAt: { lte: now }, word: { deckId: null } },
      _count: true,
    });
    const dueBy = new Map(due.map((d) => [d.userId, d._count]));

    for (const s of mine) {
      const n = dueBy.get(s.id) ?? 0;
      if (n === 0 || !s.email) continue;
      try {
        await sendStudyReminder(s.email, n, link);
        sent++;
      } catch (err) {
        // One bad address must not stop everyone after them.
        console.error("Reminder not sent", err instanceof Error ? err.message : "unknown error");
      }
    }
  }
  return { checked, sent };
}
