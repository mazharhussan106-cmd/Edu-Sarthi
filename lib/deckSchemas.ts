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
  /// Library decks one person may follow. Separate from decksPerUser: a follow
  /// is a pointer, not a deck of their own.
  followsPerUser: 50,
  /// A small fix to a published deck (owner's decision): characters changed
  /// per field, and cards per deck per IST day. Each card once a day.
  smallFixChars: 30,
  smallFixCardsPerDay: 10,
  /// People one deck may be shared with by name, invited or accepted.
  membersPerDeck: 10,
  /// Invitations one person may send a day: each one sends an email, so the
  /// cap keeps the invite form from becoming a way to mail strangers.
  invitesPerDay: 20,
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

/// How a creator's name shows on public decks. A typed display name is
/// shown to everyone, so it must not smuggle in contact details or links —
/// the library is no place to collect students' phone numbers.
export const publicNameSchema = z
  .object({
    creditStyle: z.enum(["FULL_NAME", "FIRST_NAME", "DISPLAY_NAME", "NONE"], "Choose how your name shows"),
    publicName: z.string().trim().max(40, "Keep the display name under 40 characters").default(""),
  })
  .superRefine((v, ctx) => {
    if (v.creditStyle !== "DISPLAY_NAME") return;
    const n = v.publicName;
    const issue = (message: string) => ctx.addIssue({ code: "custom", path: ["publicName"], message });
    if (n.length < 2) return issue("Type a display name of at least 2 characters, or choose another option.");
    if (!/^[\p{L}\p{N} .'-]+$/u.test(n)) return issue("Use only letters, numbers, spaces, dots, hyphens and apostrophes in the display name.");
    if (/\d{5,}/.test(n) || /(www|http|\.com|\.in)/i.test(n)) return issue("Leave phone numbers and website addresses out of the display name.");
  });

/// The submit form. The four ticks are required every time a deck is
/// submitted; `adult` only matters until the account has confirmed it once.
/// `openWeb` is the agreement that anyone, signed in or not, can read the deck
/// and search engines may list it (library terms 2026-10-29).
/// `asInstitute` publishes under the institute's name and logo, and then
/// needs a fifth tick, `behalf`; who may choose it is checked in
/// lib/deckReview.
export const publishConsentSchema = z
  .object({
    adult: z.boolean(),
    ownWork: z.literal(true, "Tick that you made this deck or have the right to share it."),
    licence: z.literal(true, "Tick that you agree to the licence the deck is published under."),
    openWeb: z.literal(true, "Tick that you understand anyone can read a published deck, with or without an account."),
    paidUse: z.literal(true, "Tick that EduSarthi may use the deck in paid features."),
    name: publicNameSchema,
    asInstitute: z.boolean().default(false),
    behalf: z.boolean().default(false),
  })
  .refine((v) => !v.asInstitute || v.behalf, { path: ["behalf"], message: "Tick that you may publish this deck on behalf of your institute, or choose to publish it as yourself." });

export type PublishConsent = z.infer<typeof publishConsentSchema>;

export const deckActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...deckFields }),
  z.object({ action: z.literal("update"), id: z.string().min(1), ...deckFields }),
  z.object({ action: z.literal("delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("share"), id: z.string().min(1), on: z.boolean() }),
  z.object({ action: z.literal("copy"), token: z.string().min(8).max(64) }),
  z.object({ action: z.literal("copyPublic"), deckId: z.string().min(1) }),
  z.object({ action: z.literal("copyInstitute"), deckId: z.string().min(1) }),
  z.object({ action: z.literal("copyMember"), deckId: z.string().min(1) }),
  z.object({ action: z.literal("publish"), id: z.string().min(1), consent: publishConsentSchema }),
  z.object({ action: z.literal("unpublish"), id: z.string().min(1) }),
  z.object({ action: z.literal("startVersion"), id: z.string().min(1) }),
  z.object({ action: z.literal("follow"), deckId: z.string().min(1) }),
  z.object({ action: z.literal("unfollow"), deckId: z.string().min(1) }),
]);

/// Sharing a deck with named people (lib/deckMembers). `adult` and `terms`
/// matter only for an editor of a deck in the public library.
export const memberActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("invite"), deckId: z.string().min(1), email: z.string().trim().toLowerCase().pipe(z.email("Enter the email address they sign in with")), role: z.enum(["VIEW", "EDIT"], "Choose view or edit") }),
  z.object({ action: z.literal("accept"), memberId: z.string().min(1), adult: z.boolean().default(false), terms: z.boolean().default(false) }),
  z.object({ action: z.literal("decline"), memberId: z.string().min(1) }),
  z.object({ action: z.literal("confirm"), deckId: z.string().min(1), adult: z.boolean(), terms: z.boolean() }),
  z.object({ action: z.literal("remove"), memberId: z.string().min(1) }),
  z.object({ action: z.literal("leave"), deckId: z.string().min(1) }),
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
  /// openedAt: when the person opened the card, so a save over someone else's
  /// newer change is refused instead of silently overwriting it.
  z.object({ action: z.literal("edit"), cardId: z.string().min(1), openedAt: z.iso.datetime().optional(), ...cardFields }),
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
