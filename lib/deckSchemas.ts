// Owns the shape and limits of a student's deck and its cards. The same
// schemas run in the browser (for instant feedback) and in the API routes (for
// enforcement) — client validation is assumed bypassed.
//
// It deliberately holds no database or storage code. Media arrives here only
// as storage keys; whether a key really exists and belongs to the user is
// checked by the route, not guessed from its shape.

import { z } from "zod";

import { parseVideoUrl } from "@/lib/video";

export const DECK_LIMITS = {
  decksPerUser: 20,
  cardsPerDeck: 500,
  /// Kept small on purpose: students are often on patchy mobile data, and a
  /// 12 MB phone photo makes a card unusable to the person it is shared with.
  imageBytes: 2 * 1024 * 1024,
  audioBytes: 2 * 1024 * 1024,
  audioSeconds: 60,
  /// A public deck with two cards is not worth an admin's review.
  minCardsToPublish: 3,
  /// Distinct open reports that pull a public deck back to review on their own.
  reportsToHide: 3,
} as const;

const tag = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(24, "Keep each tag under 24 characters");

export const deckFields = {
  title: z.string().trim().min(2, "Give the deck a name of at least 2 characters").max(80, "Keep the name under 80 characters"),
  description: z.string().trim().max(300, "Keep the description under 300 characters").default(""),
  tags: z.array(tag).max(5, "Use up to 5 tags"),
};

export const deckActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...deckFields }),
  z.object({ action: z.literal("update"), id: z.string().min(1), ...deckFields }),
  z.object({ action: z.literal("delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("share"), id: z.string().min(1), on: z.boolean() }),
  z.object({ action: z.literal("copy"), token: z.string().min(8).max(64) }),
  z.object({ action: z.literal("copyPublic"), deckId: z.string().min(1) }),
  z.object({ action: z.literal("copyInstitute"), deckId: z.string().min(1) }),
  z.object({ action: z.literal("publish"), id: z.string().min(1) }),
  z.object({ action: z.literal("unpublish"), id: z.string().min(1) }),
]);

export const reportSchema = z.object({
  deckId: z.string().min(1),
  reason: z.enum(["INAPPROPRIATE", "INCORRECT", "COPYRIGHT", "SPAM", "OTHER"], "Choose a reason"),
  note: z.string().trim().max(500, "Keep the note under 500 characters").default(""),
});

export const REPORT_REASONS = {
  INAPPROPRIATE: "Inappropriate or offensive",
  INCORRECT: "Wrong or misleading",
  COPYRIGHT: "Copied from someone else",
  SPAM: "Spam or advertising",
  OTHER: "Something else",
} as const;

const cardFields = {
  front: z.string().trim().min(1, "Write the front of the card").max(200, "Keep the front under 200 characters"),
  back: z.string().trim().min(1, "Write the back of the card").max(500, "Keep the back under 500 characters"),
  example: z.string().trim().max(300, "Keep the example under 300 characters").default(""),
  /// Markdown. Rendered by components/decks/CardMarkdown, which builds React
  /// elements and never raw HTML.
  body: z.string().trim().max(2000, "Keep the extra notes under 2000 characters").default(""),
  imageKey: z.string().min(1).nullable().default(null),
  audioKey: z.string().min(1).nullable().default(null),
  /// Teacher-only (the route ignores it for students). A YouTube or Drive
  /// link, or empty; the route stores the rebuilt embed address.
  videoUrl: z
    .string()
    .trim()
    .max(300, "That link is too long")
    .default("")
    .refine((v) => v === "" || parseVideoUrl(v) !== null, "Paste a YouTube or Google Drive video link, or leave it empty"),
  /// Teacher-only: what to listen for when checking a learner's spoken answer.
  audit: z.string().trim().max(1000, "Keep the teacher’s guide under 1000 characters").default(""),
};

export const cardActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), ...cardFields }),
  z.object({ action: z.literal("edit"), cardId: z.string().min(1), ...cardFields }),
  z.object({ action: z.literal("delete"), cardId: z.string().min(1) }),
]);

export const mediaRequestSchema = z.object({
  kind: z.enum(["IMAGE", "AUDIO"]),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive("That file appears to be empty"),
});

export type DeckInput = z.input<typeof deckActionSchema>;
export type CardInput = z.input<typeof cardActionSchema>;

/// "work, office , " → ["work","office"]. The form's single text box becomes
/// the array the schema wants; duplicates are dropped.
export function parseTags(raw: string): string[] {
  return [...new Set(raw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
}
