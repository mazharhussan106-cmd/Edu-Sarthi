// Owns the shape of the user preferences Json column: the allowlist of keys
// this app understands, and their defaults.
//
// It lives in lib/ rather than beside the route handler so that a client
// component can import DEFAULT_PREFERENCES without dragging Prisma and Auth.js
// into the browser bundle.
//
// A key absent from here is rejected on write. Otherwise the Json column
// becomes a dumping ground that nothing can safely read back.

import { z } from "zod";

import { CARD_COLOR_VALUES, type CardColor } from "@/lib/cardColors";
import { TEXT_SIZE_VALUES } from "@/lib/textSize";

/// Self-described on the profile, never tested. "unset" is a real value so a
/// student who skips it is not silently labelled Beginner.
export const LEVELS = [
  { value: "unset", label: "Not set" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;
export const GOALS = [
  { value: "unset", label: "Not set" },
  { value: "daily", label: "Daily English" },
  { value: "interview", label: "Interviews" },
  { value: "ielts", label: "IELTS / exams" },
  { value: "work", label: "Work English" },
] as const;

export const PREFERENCE_SCHEMA = z.object({
  emailOnAudit: z.boolean(),
  autoplayAudit: z.boolean(),
  // Replaces the old largerText boolean, which no page ever read. A stored
  // largerText key is simply ignored and the user starts at "normal".
  textSize: z.enum(TEXT_SIZE_VALUES),
  cardColor: z.enum(CARD_COLOR_VALUES),
  newPerDay: z.number().int().min(5).max(50),
  emailReminder: z.boolean(),
  level: z.enum(LEVELS.map((l) => l.value) as [string, ...string[]]),
  goal: z.enum(GOALS.map((g) => g.value) as [string, ...string[]]),
  dataSaver: z.boolean(),
  hideHindi: z.boolean(),
  autoSpeak: z.boolean(),
});

export type Preferences = z.infer<typeof PREFERENCE_SCHEMA>;

export const DEFAULT_PREFERENCES: Preferences = {
  emailOnAudit: true,
  autoplayAudit: false,
  textSize: "normal",
  cardColor: "plain" as CardColor,
  newPerDay: 10,
  // Off until the student opts in: nobody gets a daily email they never asked for.
  emailReminder: false,
  level: "unset",
  goal: "unset",
  dataSaver: false,
  hideHindi: false,
  // Off by default for the same reason as autoplayAudit: a phone that speaks
  // on every card is a surprise on a bus.
  autoSpeak: false,
};

/// Choices offered in settings. A short list, not a free number: a student who
/// types 500 has not chosen a plan, they have broken their daily session.
export const NEW_PER_DAY_OPTIONS = [5, 10, 15, 20, 30] as const;

/// The daily new-card limit from a stored preferences value. Read loosely so a
/// row written before this setting existed (or a value this version no longer
/// accepts) falls back to the default instead of failing the page.
export function newPerDayOf(stored: unknown): number {
  const parsed = PREFERENCE_SCHEMA.pick({ newPerDay: true }).partial().safeParse(stored ?? {});
  return (parsed.success && parsed.data.newPerDay) || DEFAULT_PREFERENCES.newPerDay;
}
