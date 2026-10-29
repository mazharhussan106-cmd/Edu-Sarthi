// Owns reading a student's XP per India day from rows that already exist:
// card answers in ReviewLog and recordings in Submission. Nothing about XP is
// stored, the same way badges are computed (lib/badges): a stored total needs
// a job to keep it right and drifts when history is deleted.
//
// It deliberately counts a card once per day, however many times it was
// answered that day, so tapping Known and Unknown on one card earns nothing
// extra. The rules themselves live in lib/streak (no database there).
//
// ReviewLog exists only since 26 Oct 2026, so card XP starts then; recordings
// count from the first one.

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { XP_NEW_CARD, XP_RECORDING, XP_REVIEW } from "@/lib/streak";

export type DayXp = { newCards: number; reviews: number; recordings: number; xp: number };

// The columns are UTC timestamps without a zone. Adding 5 h 30 min before
// taking the date gives the India day; India has no daylight saving, so a
// fixed offset is exact.
const IST_DAY = (col: string) => Prisma.raw(`(("${col}" + interval '330 minutes')::date)::text`);

/// Every day the student earned XP, all time. One row per active day, so even
/// a year of daily study is a few hundred rows.
export async function xpDays(userId: string): Promise<{ days: Map<string, DayXp>; total: number }> {
  const [cards, recordings] = await Promise.all([
    // A card answered on the day its CardState was created is new (+2); any
    // other day it is a review (+1). A card only tagged before its first answer
    // counts as a review: one XP short, on purpose simpler than tracking it.
    prisma.$queryRaw<{ day: string; cards: number; newCards: number }[]>(Prisma.sql`
      SELECT d.day,
             COUNT(*)::int AS cards,
             COUNT(*) FILTER (WHERE ((cs."createdAt" + interval '330 minutes')::date)::text = d.day)::int AS "newCards"
      FROM (
        SELECT DISTINCT "wordId", ${IST_DAY("createdAt")} AS day
        FROM "ReviewLog" WHERE "userId" = ${userId}
      ) d
      LEFT JOIN "CardState" cs ON cs."userId" = ${userId} AND cs."wordId" = d."wordId"
      GROUP BY d.day`),
    prisma.$queryRaw<{ day: string; n: number }[]>(Prisma.sql`
      SELECT ${IST_DAY("createdAt")} AS day, COUNT(*)::int AS n
      FROM "Submission" WHERE "studentId" = ${userId}
      GROUP BY 1`),
  ]);

  const days = new Map<string, DayXp>();
  const at = (day: string) => {
    let d = days.get(day);
    if (!d) days.set(day, (d = { newCards: 0, reviews: 0, recordings: 0, xp: 0 }));
    return d;
  };
  for (const r of cards) {
    const d = at(r.day);
    d.newCards = r.newCards;
    d.reviews = r.cards - r.newCards;
  }
  for (const r of recordings) at(r.day).recordings = r.n;

  let total = 0;
  for (const d of days.values()) {
    d.xp = d.newCards * XP_NEW_CARD + d.reviews * XP_REVIEW + d.recordings * XP_RECORDING;
    total += d.xp;
  }
  return { days, total };
}

/// Just the XP number per day, which is all the streak and week logic needs.
export function xpMap(days: ReadonlyMap<string, DayXp>): Map<string, number> {
  return new Map([...days].map(([day, d]) => [day, d.xp]));
}
