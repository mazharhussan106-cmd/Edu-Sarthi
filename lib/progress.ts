// Owns the student's habit numbers: the daily streak and today's goal.
//
// Days are counted in India time, not UTC. A student recording at 11 pm IST is
// recording "today" — in UTC that is already tomorrow for half the evening,
// and the streak would break on the one night they kept it.
//
// It deliberately does NOT query. The caller passes submission dates it has
// already fetched.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/// One recording a day. Small on purpose: the goal is showing up, and a
/// target a student misses every day teaches them to ignore it.
export const DAILY_GOAL = 1;

function dayNumber(d: Date): number {
  return Math.floor((d.getTime() + IST_OFFSET_MS) / 86_400_000);
}

export function streakDays(dates: readonly Date[], now = new Date()): number {
  const days = new Set(dates.map(dayNumber));
  let day = dayNumber(now);
  // A streak survives until the end of today: if nothing is sent yet today,
  // it counts back from yesterday rather than resetting at midnight.
  if (!days.has(day)) day -= 1;
  let count = 0;
  while (days.has(day)) {
    count += 1;
    day -= 1;
  }
  return count;
}

export function sentToday(dates: readonly Date[], now = new Date()): number {
  const today = dayNumber(now);
  return dates.filter((d) => dayNumber(d) === today).length;
}
