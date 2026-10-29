// Owns streak freezes: settling the days since a student's dashboard last
// looked, in order, so a missed day is covered by a held freeze and a week
// that met the weekly goal earns one (Phase 3, docs/DASHBOARD-PLAN.md).
//
// Settled once, then stored (StreakLedger, StreakFreeze) and never redone.
// Worked out afresh each time, a freeze would move whenever the student
// changed a goal: lowering it could revive an old streak, raising it could
// erase today's. Today is never settled; it is still in progress.
//
// It deliberately spends a freeze only on a day that breaks a live streak.
// Burning freezes during a long break protects nothing, and the student would
// come back to none.
//
// If the tables do not exist yet (merged, Database setup not yet run), it
// returns "no freezes" and the dashboard works as before.

import { prisma } from "@/lib/prisma";
import { FREEZE_MAX, FREEZE_START, STREAK_MIN_XP, addDays, type XpByDay } from "@/lib/streak";

export type FreezeState = { held: number; weeksMet: number; frozen: Set<string> };

/// The settling itself, with no database: given the ledger's last settled day,
/// walk each later day up to yesterday.
export function settleDays(
  xp: XpByDay,
  from: { held: number; weeksMet: number; checkedThrough: string },
  yesterday: string,
  frozen: ReadonlySet<string>,
  goal: number,
  weeklyGoal: number,
): { held: number; weeksMet: number; used: string[] } {
  let { held, weeksMet } = from;
  const used: string[] = [];
  const isFrozen = (d: string) => frozen.has(d) || used.includes(d);
  for (let d = addDays(from.checkedThrough, 1); d <= yesterday; d = addDays(d, 1)) {
    const prev = addDays(d, -1);
    const alive = (xp.get(prev) ?? 0) >= STREAK_MIN_XP || isFrozen(prev);
    if ((xp.get(d) ?? 0) < STREAK_MIN_XP && alive && held > 0) {
      held -= 1;
      used.push(d);
    }
    // Sunday closes the India week (Monday to Sunday).
    if (new Date(`${d}T00:00:00Z`).getUTCDay() === 0) {
      let met = 0;
      for (let i = 0; i < 7; i++) if ((xp.get(addDays(d, -i)) ?? 0) >= goal) met += 1;
      if (met >= weeklyGoal) {
        weeksMet += 1;
        held = Math.min(FREEZE_MAX, held + 1);
      }
    }
  }
  return { held, weeksMet, used };
}

export async function settleFreezes(userId: string, xp: XpByDay, today: string, goal: number, weeklyGoal: number): Promise<FreezeState> {
  const yesterday = addDays(today, -1);
  try {
    const [ledger, rows] = await Promise.all([
      prisma.streakLedger.findUnique({ where: { userId } }),
      prisma.streakFreeze.findMany({ where: { userId }, select: { day: true } }),
    ]);
    const frozen = new Set(rows.map((r) => r.day));

    // Freezes start the first time the student is seen, from today: earlier
    // history is not re-judged.
    if (!ledger) {
      await prisma.streakLedger.createMany({ data: [{ userId, held: FREEZE_START, checkedThrough: yesterday }], skipDuplicates: true });
      return { held: FREEZE_START, weeksMet: 0, frozen };
    }
    if (ledger.checkedThrough >= yesterday) return { held: ledger.held, weeksMet: ledger.weeksMet, frozen };

    const next = settleDays(xp, ledger, yesterday, frozen, goal, weeklyGoal);
    // The ledger and its freeze days commit together or not at all. The update
    // only matches the day this read saw, so two tabs settling at once cannot
    // both spend a freeze: the second finds nothing to update and adds nothing.
    const won = await prisma.$transaction(
      async (tx) => {
        const res = await tx.streakLedger.updateMany({
          where: { userId, checkedThrough: ledger.checkedThrough },
          data: { held: next.held, weeksMet: next.weeksMet, checkedThrough: yesterday },
        });
        if (res.count === 0) return false;
        if (next.used.length > 0) {
          await tx.streakFreeze.createMany({ data: next.used.map((day) => ({ userId, day })), skipDuplicates: true });
        }
        return true;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
    if (!won) {
      // The other request settled it; read what it stored.
      const [l, r] = await Promise.all([
        prisma.streakLedger.findUnique({ where: { userId } }),
        prisma.streakFreeze.findMany({ where: { userId }, select: { day: true } }),
      ]);
      return { held: l?.held ?? 0, weeksMet: l?.weeksMet ?? 0, frozen: new Set(r.map((x) => x.day)) };
    }
    for (const d of next.used) frozen.add(d);
    return { held: next.held, weeksMet: next.weeksMet, frozen };
  } catch (err) {
    console.error("streak freezes unavailable (has Database setup run?)", err);
    return { held: 0, weeksMet: 0, frozen: new Set() };
  }
}
