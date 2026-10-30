// Owns the shape and limits of a student's study tabs (layer 1 of the
// Flashcard filters): the tab name, how many tabs and decks, and every action
// the tabs API accepts. The same schemas run in the browser (instant feedback)
// and in the API route (enforcement) — client validation is assumed bypassed.
//
// It deliberately holds no database code (lib/studyTabs does), so a client
// component can import it without pulling Prisma into the browser.

import { z } from "zod";

export const TAB_LIMITS = {
  /// The student's own tabs, not counting English, Tech and My decks.
  ownTabs: 20,
  /// Long enough for "IELTS speaking – week 3", short enough for a phone's tab row.
  nameChars: 30,
  decksPerTab: 100,
} as const;

/// How a built-in tab is named in a layout sent by the browser: it may not
/// have a database row yet (rows are made the first time anything is saved).
export const BUILT_IN_KEYS = ["english", "tech", "decks"] as const;
export type BuiltInKey = (typeof BUILT_IN_KEYS)[number];

// cuid ids: lower-case letters and digits. Anything else is not one of ours.
const id = z.string().regex(/^[a-z0-9]{10,40}$/, "That tab or deck no longer exists. Close this and open it again.");

export const tabNameSchema = z
  .string()
  .trim()
  .min(1, "Give the tab a name, for example Exam prep.")
  .max(TAB_LIMITS.nameChars, `Keep the name to ${TAB_LIMITS.nameChars} characters or fewer.`);

export const tabActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: tabNameSchema }),
  z.object({ action: z.literal("rename"), id, name: tabNameSchema }),
  z.object({ action: z.literal("delete"), id }),
  /// Every tab, in the new order, each shown or hidden. The server refuses a
  /// list that does not match the student's tabs exactly (changed elsewhere).
  z.object({
    action: z.literal("arrange"),
    tabs: z
      .array(z.object({ key: z.union([z.enum(BUILT_IN_KEYS), id]), hidden: z.boolean() }))
      .min(1)
      .max(TAB_LIMITS.ownTabs + BUILT_IN_KEYS.length)
      .refine((t) => t.some((x) => !x.hidden), "Keep at least one tab showing, or there is nothing to open."),
  }),
  /// The decks one own tab holds, replacing what it held (the Add decks sheet).
  z.object({
    action: z.literal("setDecks"),
    id,
    deckIds: z.array(id).max(TAB_LIMITS.decksPerTab, `A tab holds up to ${TAB_LIMITS.decksPerTab} decks. Untick some, then save.`),
  }),
  z.object({ action: z.literal("removeDeck"), id, deckId: id }),
  /// The own tabs one deck shows in, replacing where it showed (asked after a
  /// copy or import). A new tab can be made in the same step.
  z.object({
    action: z.literal("placeDeck"),
    deckId: id,
    tabIds: z.array(id).max(TAB_LIMITS.ownTabs),
    newTab: tabNameSchema.optional(),
  }),
]);

export type TabAction = z.infer<typeof tabActionSchema>;
