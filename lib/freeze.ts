// Owns streak freezes: settling the days since a student was last seen, in
// order, so a missed day is covered by a held freeze and a week that met the
// weekly goal earns one (Phase 3, docs/DASHBOARD-PLAN.md). Also owns the one
// "current streak" read that the header, Profile and the reminder email share.
//
// Settled once, then stored (StreakLedger, StreakFreeze) and never redone.
// Worked out afresh each time, a freeze would move whenever the student
// changed a goal: lowering it could revive an old streak, raising it could
// erase today's. Today is never settled; it is still in progress.
//
// It deliberately spends freezes only where they keep a live streak alive.
// When the days being settled show a break longer than the freezes held, the
// freezes spent on that break are given back: the streak ends either way, and
// the student should not come back to none.
//
// If the tables do not exist yet (merged, Database setup not yet run), it
// returns "no freezes" and the pages work as before. Any other database error
// is not hidden behind a wrong streak: a failed read is thrown like every
// other query's, and a failed save still shows the settled result and is
// retried on the next visit.

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { FREEZE_MAX, FREEZE_START, STREAK_MIN_XP, addDays, istDay, streakOf, type XpByDay } from "@/lib/streak";
import { xpDays, xpMap } from "@/lib/xp";

export type FreezeState = { held: number; weeksMet: number; frozen: Set<string> };

const NONE = (): FreezeState => ({ held: 0, weeksMet: 0, frozen: new Set() });

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
  // Freezes spent on the run of missed days in progress, in case it breaks.
  let run: string[] = [];
  const isFrozen = (d: string) => frozen.has(d) || used.includes(d);

  for (let d = addDays(from.checkedThrough, 1); d <= yesterday; d = addDays(d, 1)) {
    // Sunday closes the India week (Monday to Sunday) before the day itself is
    // judged, so a freeze the week earns can cover a missed Sunday.
    if (new Date(`${d}T00:00:00Z`).getUTCDay() === 0) {
      let met = 0;
      for (let i = 0; i < 7; i++) if ((xp.get(addDays(d, -i)) ?? 0) >= goal) met += 1;
      if (met >= weeklyGoal) {
        weeksMet += 1;
        held = Math.min(FREEZE_MAX, held + 1);
      }
    }
    if ((xp.get(d) ?? 0) >= STREAK_MIN_XP) {
      run = [];
      continue;
    }
    const prev = addDays(d, -1);
    const alive = (xp.get(prev) ?? 0) >= STREAK_MIN_XP || isFrozen(prev);
    if (!alive) {
      run = [];
      continue;
    }
    if (held > 0) {
      held -= 1;
      used.push(d);
      run.push(d);
    } else {
      // The streak breaks here anyway: what this run spent saved nothing.
      held = Math.min(FREEZE_MAX, held + run.length);
      for (const r of run) used.splice(used.indexOf(r), 1);
      run = [];
    }
  }
  return { held, weeksMet, used };
}

const missingTable = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2021" || err.code === "P2022");

export async function settleFreezes(userId: string, xp: XpByDay, today: string, goal: number, weeklyGoal: number): Promise<FreezeState> {
  const yesterday = addDays(today, -1);
  let ledger: { held: number; weeksMet: number; checkedThrough: string } | null;
  let frozen: Set<string>;
  try {
    const [l, rows] = await Promise.all([
      prisma.streakLedger.findUnique({ where: { userId }, select: { held: true, weeksMet: true, checkedThrough: true } }),
      prisma.streakFreeze.findMany({ where: { userId }, select: { day: true } }),
    ]);
    ledger = l;
    frozen = new Set(rows.map((r) => r.day));
  } catch (err) {
    if (missingTable(err)) {
      console.error("Streak freezes are off until Actions → Database setup adds their tables.");
      return NONE();
    }
    throw err;
  }

  // Freezes start the first time the student is seen, from today: earlier
  // history is not re-judged.
  if (!ledger) {
    await prisma.streakLedger
      .createMany({ data: [{ userId, held: FREEZE_START, checkedThrough: yesterday }], skipDuplicates: true })
      .catch((err) => console.error("Streak ledger not created; retried next visit", err instanceof Error ? err.message : err));
    return { held: FREEZE_START, weeksMet: 0, frozen };
  }
  if (ledger.checkedThrough >= yesterday) return { held: ledger.held, weeksMet: ledger.weeksMet, frozen };

  const next = settleDays(xp, ledger, yesterday, frozen, goal, weeklyGoal);
  const from = ledger.checkedThrough;
  try {
    // The ledger and its freeze days commit together or not at all. The update
    // only matches the day this read saw, so two tabs settling at once cannot
    // both spend a freeze: the second finds nothing to update and adds nothing.
    const won = await prisma.$transaction(
      async (tx) => {
        const res = await tx.streakLedger.updateMany({
          where: { userId, checkedThrough: from },
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
  } catch (err) {
    // Shown as settled now; the same days are settled and saved next visit.
    console.error("Streak freezes not saved; retried next visit", err instanceof Error ? err.message : err);
  }
  for (const d of next.used) frozen.add(d);
  return { held: next.held, weeksMet: next.weeksMet, frozen };
}

/// The current streak for one student, freezes settled, with what Profile,
/// the header and the reminder email need. The dashboard reads XP in its own
/// batch and calls settleFreezes directly, with the same rules.
export async function currentStreak(userId: string, goal: number, weeklyGoal: number, now = new Date()) {
  const today = istDay(now);
  const xp = await xpDays(userId);
  const byDay = xpMap(xp.days);
  const state = await settleFreezes(userId, byDay, today, goal, weeklyGoal);
  return { ...state, byDay, total: xp.total, today, todayXp: byDay.get(today) ?? 0, streak: streakOf(byDay, today, state.frozen) };
}
