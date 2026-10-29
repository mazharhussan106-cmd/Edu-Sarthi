// Owns the game rules of the student dashboard and the date logic behind them:
// how much XP each action earns, what makes a streak day, the week's dots and
// the stage a total of XP reaches. Accepted by the owner on 29 Oct 2026
// (docs/DASHBOARD-PLAN.md).
//
// It deliberately has no database code, so the rules can be read by a client
// component (the XP sheet in Phase 2) and checked against fixed dates without
// a database. The XP per day it works on comes from lib/xp.
//
// Days are India days ("YYYY-MM-DD" in Asia/Kolkata). A student practising at
// 11 pm IST is practising "today"; UTC would end their day at 5:30 am.

/// XP is for effort, never for audit scores: rewarding scores would punish a
/// weak recording and push students away from honest practice.
export const XP_NEW_CARD = 2;
export const XP_REVIEW = 1;
export const XP_RECORDING = 10;
/// About ten reviews, five new cards or one recording: small enough to keep on
/// a busy day, so the streak measures showing up, not effort.
export const STREAK_MIN_XP = 10;
/// The daily goal (the ring) and the weekly goal (days a week the ring is
/// filled) are the student's choice in Settings → Flashcards; these are the
/// defaults and the only values offered. A short list, not a free number: a
/// goal of 500 is not a plan, it is a ring that never fills.
export const DAILY_GOAL_XP = 40;
export const WEEKLY_GOAL_DAYS = 5;
export const DAILY_GOALS = [
  { xp: 20, name: "Easy", time: "about 5 minutes" },
  { xp: 40, name: "Regular", time: "about 10 minutes" },
  { xp: 60, name: "Serious", time: "about 15 minutes" },
  { xp: 100, name: "Intense", time: "about 25 minutes" },
] as const;
export const WEEKLY_GOALS = [3, 5, 7] as const;
/// Card answers are logged (ReviewLog) only from this day, so card XP starts
/// here; the XP sheet says so instead of showing invented earlier numbers.
export const XP_SINCE = "26 Oct 2026";
/// Evening, India time, after which a streak with nothing done today is
/// called "at risk" on the dashboard.
export const AT_RISK_HOUR = 18;

export type XpByDay = ReadonlyMap<string, number>;

const IST = "Asia/Kolkata";

export function istDay(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: IST });
}

export function addDays(day: string, n: number): string {
  const t = Date.parse(`${day}T00:00:00Z`) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/// Consecutive days of at least STREAK_MIN_XP, counted back from today. A day
/// still in progress does not break it: with too little today, the count
/// starts at yesterday, so a streak survives until midnight.
export function streakOf(xp: XpByDay, today: string): number {
  let day = (xp.get(today) ?? 0) >= STREAK_MIN_XP ? today : addDays(today, -1);
  let count = 0;
  while ((xp.get(day) ?? 0) >= STREAK_MIN_XP) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

/// The longest run in the history we have. Streak badges use it, so a badge
/// once earned does not vanish when the current streak breaks.
export function longestStreak(xp: XpByDay): number {
  const days = [...xp.entries()].filter(([, n]) => n >= STREAK_MIN_XP).map(([d]) => d).sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function learningDays(xp: XpByDay): number {
  let n = 0;
  for (const v of xp.values()) if (v >= STREAK_MIN_XP) n += 1;
  return n;
}

export function bestDay(xp: XpByDay): number {
  return Math.max(0, ...xp.values());
}

export type DotState = "met" | "learned" | "missed" | "open" | "future";
export type WeekDot = { day: string; label: string; name: string; state: DotState; today: boolean };

const WEEKDAYS = [
  ["Mon", "Monday"], ["Tue", "Tuesday"], ["Wed", "Wednesday"], ["Thu", "Thursday"],
  ["Fri", "Friday"], ["Sat", "Saturday"], ["Sun", "Sunday"],
] as const;

/// Monday to Sunday of the India week holding `today`. "met" is the daily goal
/// reached, "learned" a streak day short of the goal, "open" today not yet a
/// streak day, "missed" a past day with less than STREAK_MIN_XP.
export function weekOf(xp: XpByDay, today: string, goal: number): { dots: WeekDot[]; met: number } {
  const offset = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = addDays(today, -offset);
  let met = 0;
  const dots = WEEKDAYS.map(([label, name], i) => {
    const day = addDays(monday, i);
    const n = xp.get(day) ?? 0;
    const state: DotState =
      day > today ? "future"
      : n >= goal ? "met"
      : n >= STREAK_MIN_XP ? "learned"
      : day === today ? "open"
      : "missed";
    if (state === "met") met += 1;
    return { day, label, name, state, today: day === today };
  });
  return { dots, met };
}

/// XP from Monday to today, India week.
export function weekXp(xp: XpByDay, today: string): number {
  const offset = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  let n = 0;
  for (let i = 0; i <= offset; i++) n += xp.get(addDays(today, -i)) ?? 0;
  return n;
}

export type MonthDay = { day: string; date: number; state: "met" | "learned" | "none" | "future"; today: boolean };

/// The India month holding `today`, for the streak sheet's calendar. A past
/// day with too little XP is plain "none" rather than "missed": a month view
/// full of misses before the student even joined would only scold.
export function monthOf(xp: XpByDay, today: string, goal: number): { title: string; lead: number; days: MonthDay[] } {
  const first = `${today.slice(0, 8)}01`;
  const start = new Date(`${first}T00:00:00Z`);
  const lead = (start.getUTCDay() + 6) % 7;
  const days: MonthDay[] = [];
  for (let d = first; d.slice(0, 7) === first.slice(0, 7); d = addDays(d, 1)) {
    const n = xp.get(d) ?? 0;
    days.push({
      day: d,
      date: Number(d.slice(8)),
      state: d > today ? "future" : n >= goal ? "met" : n >= STREAK_MIN_XP ? "learned" : "none",
      today: d === today,
    });
  }
  const title = start.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
  return { title, lead, days };
}

/// Stage n starts at 50·n·(n−1) XP: 100 for Stage 2, 1,000 for Stage 5, 4,500
/// for Stage 10. Each stage takes a little longer than the one before, which
/// keeps early stages quick for a new student.
export function stageOf(total: number): { stage: number; from: number; to: number } {
  const stage = Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * Math.max(0, total)) / 100)) / 2));
  return { stage, from: 50 * stage * (stage - 1), to: 50 * (stage + 1) * stage };
}

export function istHour(now: Date): number {
  return Number(now.toLocaleString("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: IST }));
}

/// Evening, a streak to lose, and not yet enough today to keep it.
export function streakAtRisk(now: Date, todayXp: number, streak: number): boolean {
  return streak > 0 && todayXp < STREAK_MIN_XP && istHour(now) >= AT_RISK_HOUR;
}
