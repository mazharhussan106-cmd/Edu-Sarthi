// Owns the spaced-repetition schedule for flashcards: what Known / Unknown and
// the Hard / Medium / Easy level do to a card's next review date, and how that
// date reads on the card ("in 7 days").
//
// The ladder is the one printed in every card's Review Plan box:
//   Day 3 → 7 → 15 → 30 → 60 → 120 → 180
//
//   Unknown          → two rungs down, never below the first (3 days)
//   Known + Hard     → stays on its rung (same gap again)
//   Known + Medium   → one rung up (the default when no level is chosen)
//   Known + Easy     → two rungs up
//
// A card never comes back sooner than 3 days after any answer (the owner's
// rule, docs/SRS-V2-PLAN.md D1): the first rung is 3, and Unknown stops there.
//
// Dates are whole India-time days: a card is due from midnight IST, so "in 3
// days" means all of that day, not 72 hours after the tap. A card answered
// late, and still known, earns a gap at least as long as it stayed
// remembered. Long gaps are spread by a day or two so one day's cards do not
// all come back on the same day.
//
// It deliberately does NOT touch the database, and imports nothing that does:
// the card sides (client components) read LADDER_DAYS and describeDue. The API
// route reads the current state, asks this for the next one, and writes it.

import type { Recall } from "@prisma/client";

export const LADDER_DAYS = [3, 7, 15, 30, 60, 120, 180] as const;
export const NEW_PER_DAY = 10;

const DAY = 86_400_000;
const IST = 5.5 * 3_600_000;
const TOP = LADDER_DAYS.length - 1;

/// Midnight India time at the start of the day `at` falls on. The one
/// definition of "today" for the daily limits (lib/flashcards, lib/todayReview).
export function istDayStart(at = new Date()): Date {
  return new Date(Math.floor((at.getTime() + IST) / DAY) * DAY - IST);
}

/// How many due cards today will serve under a review limit (0 = none), when
/// `reviewedToday` reviews are done. One rule for the Flashcard tab, the
/// Today page, the Dashboard and the reminder email, so they never disagree.
export function servableDue(due: number, reviewedToday: number, reviewsPerDay: number): number {
  return reviewsPerDay > 0 ? Math.min(due, Math.max(0, reviewsPerDay - reviewedToday)) : due;
}

/// Whole India-time days from `from` to `to` (calendar days, not 24-hour blocks).
function istDaysBetween(from: Date, to: Date): number {
  return Math.round((istDayStart(to).getTime() - istDayStart(from).getTime()) / DAY);
}

/// The lowest rung whose gap covers `days`, so a card remembered for 20 days
/// is not sent back sooner than 30.
function rungCovering(days: number): number {
  const i = LADDER_DAYS.findIndex((d) => d >= days);
  return i === -1 ? TOP : i;
}

/// Upper edges of each rung's band of gaps, halfway between neighbouring rungs
/// (3|7 → 5, 7|15 → 11, …). A gap actually given — v2's ±2-day spread, or
/// the v1 ladder's 1 and 3 days — falls inside exactly one band.
export const RUNG_BANDS = [5, 11, 22.5, 45, 90, 150] as const;

/// The rung a card is on, read from the gap it was last given rather than its
/// stored step number. Cards from the v1 ladder (1 · 3 · 7 · 15 · 30 · 60)
/// store a step one place off; their gap still says where they are, so an
/// answer before scripts/srs-v2-restage.ts has run cannot jump a rung.
export function rungForGap(days: number): number {
  const i = RUNG_BANDS.findIndex((edge) => days < edge);
  return i === -1 ? TOP : i;
}

/// ±1 day on a 15-day gap, ±2 from 30 up, none below. Fixed per answer (from
/// `key`), not random: the same answer always gives the same date, so a retry
/// cannot move it and the tests can check it.
function spread(gap: number, key: string): number {
  const range = gap >= 30 ? 2 : gap >= 15 ? 1 : 0;
  if (range === 0) return 0;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return (h % (2 * range + 1)) - range;
}

/// `current` is null for a card never answered, which counts as the first
/// rung. `key` makes the spread differ per card and per review: pass the card
/// id and how many times it has been reviewed.
export function nextReview(
  current: { stage: number; lastReviewedAt: Date | null; dueAt?: Date | null } | null,
  known: boolean,
  recall: Recall | null,
  key: string,
  now = new Date(),
): { stage: number; dueAt: Date } {
  // From the gap when there is one (see rungForGap); the stored step only for
  // a card never answered, clamped so a bad value cannot index past the end.
  const from =
    current?.lastReviewedAt && current.dueAt
      ? rungForGap((current.dueAt.getTime() - current.lastReviewedAt.getTime()) / DAY)
      : Math.min(TOP, Math.max(0, current?.stage ?? 0));
  let stage: number;
  if (!known) {
    stage = Math.max(0, from - 2);
  } else {
    const step = recall === "HARD" ? 0 : recall === "EASY" ? 2 : 1;
    stage = Math.min(TOP, from + step);
    // Not on Hard: Hard says the card was a struggle, however long it waited.
    if (recall !== "HARD" && current?.lastReviewedAt) {
      stage = Math.max(stage, rungCovering(istDaysBetween(current.lastReviewedAt, now)));
    }
  }
  const gap = LADDER_DAYS[stage];
  const days = gap + spread(gap, key);
  return { stage, dueAt: new Date(istDayStart(now).getTime() + days * DAY) };
}

export function describeDue(dueAt: Date, now = new Date()): string {
  // Already past (or today) is due now. Counted in India-time days, so a card
  // due from midnight reads "tomorrow" all evening, not "in 0 days".
  if (dueAt.getTime() <= now.getTime()) return "due now";
  const days = istDaysBetween(now, dueAt);
  // Only a card scheduled before v2 (exact hours) can fall later today.
  if (days === 0) return "later today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
