// Owns the student's habit numbers: the daily streak, the longest streak and
// today's goal.
//
// Days are counted in India time, not UTC. A student recording at 11 pm IST is
// recording "today" — in UTC that is already tomorrow for half the evening,
// and the streak would break on the one night they kept it.
//
// It deliberately does NOT query. Callers pass dates, or the day numbers from
// lib/practiceDays, which decides what counts as a practice day.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/// One recording a day. Small on purpose: the goal is showing up, and a
/// target a student misses every day teaches them to ignore it.
export const DAILY_GOAL = 1;

export function dayNumber(d: Date): number {
  return Math.floor((d.getTime() + IST_OFFSET_MS) / 86_400_000);
}

/// The run of days ending today. It survives until the end of today: if
/// nothing is done yet today, it counts back from yesterday rather than
/// resetting at midnight.
export function streakOfDays(days: ReadonlySet<number>, now = new Date()): number {
  let day = dayNumber(now);
  if (!days.has(day)) day -= 1;
  let count = 0;
  while (days.has(day)) {
    count += 1;
    day -= 1;
  }
  return count;
}

/// The longest run of days in a row. A personal record: missing a day ends
/// the current streak, never this one.
export function longestStreak(days: ReadonlySet<number>): number {
  let best = 0;
  for (const d of days) {
    // Only count from the first day of a run, so each run is walked once.
    if (days.has(d - 1)) continue;
    let run = 1;
    while (days.has(d + run)) run += 1;
    best = Math.max(best, run);
  }
  return best;
}

export function streakDays(dates: readonly Date[], now = new Date()): number {
  return streakOfDays(new Set(dates.map(dayNumber)), now);
}

export function sentToday(dates: readonly Date[], now = new Date()): number {
  const today = dayNumber(now);
  return dates.filter((d) => dayNumber(d) === today).length;
}
