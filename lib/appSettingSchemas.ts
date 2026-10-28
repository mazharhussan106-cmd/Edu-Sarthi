// Owns the rules for the site-wide settings: limits, defaults and the Zod
// schema, shared by the admin form (browser) and the server.
//
// It lives apart from lib/appSettings so the admin form can import it without
// dragging Prisma into the browser bundle.

import { z } from "zod";

/// Owner's starting value (28 Oct 2026): two a day, "for now".
export const DEFAULT_AUDITS_PER_DAY = 2;
export const AUDITS_PER_DAY_MIN = 1;
export const AUDITS_PER_DAY_MAX = 10;

export const auditsPerDaySchema = z.object({
  auditsPerDay: z
    .number()
    .int("Use a whole number.")
    .min(AUDITS_PER_DAY_MIN, `Use at least ${AUDITS_PER_DAY_MIN}.`)
    .max(AUDITS_PER_DAY_MAX, `Use at most ${AUDITS_PER_DAY_MAX}.`),
});
