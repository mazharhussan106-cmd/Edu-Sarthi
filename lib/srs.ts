// Owns the spaced-repetition schedule for flashcards: what Known / Unknown and
// the Hard / Medium / Easy level do to a card's next review date.
//
// The ladder matches the one printed on every card — Day 1 → 3 → 7 → 15 → 30
// — with one more rung at 60 days for words that stay easy.
//
//   Unknown          → back to the first rung, due again tomorrow
//   Known + Hard     → stays on its rung (same gap again)
//   Known + Medium   → one rung up (the default when no level is chosen)
//   Known + Easy     → two rungs up
//
// It deliberately does NOT touch the database. The API route reads the
// current state, asks this for the next one, and writes it.

import type { Recall } from "@prisma/client";

export const LADDER_DAYS = [1, 3, 7, 15, 30, 60] as const;
export const NEW_PER_DAY = 10;

const DAY = 86_400_000;

export function nextReview(
  current: { stage: number } | null,
  known: boolean,
  recall: Recall | null,
  now = new Date(),
): { stage: number; dueAt: Date } {
  if (!known) return { stage: 0, dueAt: new Date(now.getTime() + DAY) };

  const from = current?.stage ?? 0;
  const step = recall === "HARD" ? 0 : recall === "EASY" ? 2 : 1;
  const stage = Math.min(LADDER_DAYS.length - 1, from + step);
  return { stage, dueAt: new Date(now.getTime() + LADDER_DAYS[stage] * DAY) };
}

export function describeDue(dueAt: Date, now = new Date()): string {
  const days = Math.round((dueAt.getTime() - now.getTime()) / DAY);
  if (days <= 0) return "due now";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
