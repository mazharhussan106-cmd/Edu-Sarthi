// Owns what counts as a practice day: a day on which the student sent a
// recording or answered at least one flashcard (owner's rule, 29 Oct 2026).
// The dashboard streak, the profile streaks, the streak badges and the
// practice calendar all read it, so they can never disagree.
//
// Days are India days, numbered like lib/progress (days since 1 Jan 1970 in
// IST). The counting happens in the database, one row per day, because a busy
// student answers hundreds of cards a week and only the day matters here.
//
// It deliberately does NOT decide streak rules (lib/progress) or draw anything.

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DAY = 86_400_000;

export type PracticeDay = { recordings: number; cards: number };

/// Practice per India day over the last `days` days, keyed by day number.
/// Card answers come from ReviewLog, which only exists from 26 Oct 2026, so
/// card practice before that date is missing, not zero; pages say so.
export async function practiceDays(userId: string, days = 400): Promise<Map<number, PracticeDay>> {
  const since = new Date(Date.now() - days * DAY);
  // Prisma stores UTC without a zone, so the epoch is UTC; +19800 s is IST.
  const rows = await prisma.$queryRaw<{ day: number; recordings: number; cards: number }[]>(Prisma.sql`
    SELECT day, SUM(recordings)::int AS recordings, SUM(cards)::int AS cards FROM (
      SELECT FLOOR((EXTRACT(EPOCH FROM "createdAt") + 19800) / 86400)::int AS day, COUNT(*) AS recordings, 0 AS cards
      FROM "Submission" WHERE "studentId" = ${userId} AND "createdAt" >= ${since} GROUP BY 1
      UNION ALL
      SELECT FLOOR((EXTRACT(EPOCH FROM "createdAt") + 19800) / 86400)::int AS day, 0 AS recordings, COUNT(*) AS cards
      FROM "ReviewLog" WHERE "userId" = ${userId} AND "createdAt" >= ${since} GROUP BY 1
    ) t GROUP BY day`);
  return new Map(rows.map((r) => [r.day, { recordings: r.recordings, cards: r.cards }]));
}
