// Owns the goal's target date: the day a student is practising for (an exam or
// an interview), kept as "YYYY-MM-DD" in the preferences, or "" for none.
//
// Days are India days, numbered like lib/progress, so "78 days left" turns
// over at midnight in India, not at 5:30 am. Reading accepts any real date,
// past ones too, so a passed exam can say "the day has passed" instead of
// vanishing; only a save must be today or within three years.
//
// It deliberately has no Prisma or server imports: the goal sheet uses it in
// the browser for the same checks the route makes.

import { z } from "zod";

const DAY = 86_400_000;
const IST = 5.5 * 3_600_000;
const MAX_DAYS_AHEAD = 3 * 366;

export const todayIstDay = (now = new Date()) => Math.floor((now.getTime() + IST) / DAY);

/// The day number of "YYYY-MM-DD", or null for a date that does not exist
/// (31 Feb), which Date.UTC would quietly roll into March.
export function dayOfIso(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return t.getTime() / DAY;
}

export const isoOfDay = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);

export const GOAL_DATE_SCHEMA = z.union([z.literal(""), z.string().refine((s) => dayOfIso(s) !== null)]);

/// What is wrong with a date being saved, in words the student can act on.
export function goalDateProblem(iso: string, now = new Date()): string | null {
  if (iso === "") return null;
  const day = dayOfIso(iso);
  if (day === null) return "Choose a date from the calendar.";
  const today = todayIstDay(now);
  if (day < today) return "Choose today or a later date.";
  if (day > today + MAX_DAYS_AHEAD) return "Choose a date in the next three years.";
  return null;
}

export const goalDateLimits = (now = new Date()) => ({ min: isoOfDay(todayIstDay(now)), max: isoOfDay(todayIstDay(now) + MAX_DAYS_AHEAD) });

/// Days from today to the goal date: 0 on the day, negative once it has passed.
export function daysUntil(iso: string, now = new Date()): number | null {
  const day = dayOfIso(iso);
  return day === null ? null : day - todayIstDay(now);
}

export function goalDateLabel(iso: string): string {
  const day = dayOfIso(iso);
  return day === null ? "" : new Date(day * DAY).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
