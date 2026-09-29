// Owns every Zod schema shared between a form and its route handler. Same
// object validates in both places: the client for instant feedback, the server
// for actual enforcement. Client validation is a convenience and is assumed
// bypassed.
//
// It deliberately does NOT contain business rules that need the database —
// "is this email taken" is a query, not a schema, and "is this note past the
// end of the recording" needs that recording's length.

import { z } from "zod";

// bcrypt silently truncates at 72 bytes. Without this cap, two different long
// passwords can hash identically and both unlock the account.
const MAX_PASSWORD_BYTES = 72;

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(MAX_PASSWORD_BYTES, "Use 72 characters or fewer");

const email = z
  .string()
  .min(1, "Enter your email")
  .email("Enter a valid email address")
  // Stored and compared lowercase, or the same person registers twice with
  // different capitalisation and neither login finds the other's row.
  .transform((v) => v.trim().toLowerCase());

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your name").max(80).trim(),
    email,
    password,
    confirmPassword: z.string(),
    // Collected unverified. SMS stays gated behind SMS_ENABLED until DLT
    // registration completes.
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number")
      .optional()
      .or(z.literal("")),
  })
  // Role is absent on purpose. A client-supplied role means anyone can sign up
  // as a teacher and read every student's submissions.
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

// --- Passwordless email sign-in -------------------------------------------

export const emailLoginRequestSchema = z.object({ email });

export const emailCodeSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

export const emailLinkSchema = z.object({ token: z.string().min(20).max(200) });

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// --- Teacher review --------------------------------------------------------

export const claimSchema = z.object({
  action: z.literal("claim"),
  submissionId: z.string().min(1),
});

/// Give a claimed submission back to the queue, or restart its 30 minutes.
export const holdSchema = z.object({
  action: z.enum(["release", "extend"]),
  submissionId: z.string().min(1),
});

const score = z
  .number()
  .int("Scores are whole numbers")
  .min(0, "Scores run from 0 to 10")
  .max(10, "Scores run from 0 to 10");

export const noteSchema = z.object({
  // Seconds, one decimal. Non-negative only — the upper bound depends on the
  // recording's length, which is checked in the route handler.
  at: z.number().min(0, "A note cannot be timed before the recording starts"),
  note: z
    .string()
    .trim()
    .min(3, "Write at least a few words in each note")
    .max(500, "Keep each note under 500 characters"),
  severity: z.enum(["minor", "major"]),
});

export const RETURN_REASONS = [
  "BACKGROUND_NOISE",
  "INAUDIBLE",
  "WRONG_PROMPT",
  "INCOMPLETE",
] as const;

export const returnSchema = z.object({
  action: z.literal("return"),
  submissionId: z.string().min(1),
  reason: z.enum(RETURN_REASONS, "Pick a reason"),
  note: z.string().trim().max(500, "Keep the note under 500 characters").optional(),
});

export const feedbackSchema = z.object({
  action: z.literal("submit"),
  submissionId: z.string().min(1),

  pronunciation: score,
  grammar: score,
  fluency: score,
  vocabulary: score,
  confidence: score,

  summary: z
    .string()
    .trim()
    .min(40, "Write at least a couple of sentences in the summary")
    .max(4000, "Keep the summary under 4000 characters"),

  // At least one note is required: five numbers and a paragraph do not tell a
  // student *where* the problem was, which is the thing this platform exists
  // to give them.
  notes: z
    .array(noteSchema)
    .min(1, "Add at least one timestamped note")
    .max(50, "That is more than 50 notes — write the rest in the summary"),
});

// --- Media upload ----------------------------------------------------------

/// The content type is checked against ALLOWED_TYPES in the route handler, not
/// here. Keeping the list in lib/storage.ts means the map from MIME type to
/// MediaKind lives in one place instead of being repeated as an enum.
export const uploadUrlSchema = z.object({
  filename: z
    .string()
    .min(1, "The file has no name")
    // Long enough for anything real. Sanitised to 60 characters before it
    // reaches storage; the cap here just stops a megabyte of filename.
    .max(255, "That filename is too long"),
  contentType: z.string().min(1, "Could not read the file type"),
  sizeBytes: z.number().int().positive("That file appears to be empty"),
  exerciseId: z.string().min(1),
});

export const submissionSchema = z.object({
  exerciseId: z.string().min(1),
  /// The storage key returned by /api/upload-url. Ownership is re-derived from
  /// its prefix server-side — it is never trusted as proof of anything.
  key: z.string().min(1),
  contentType: z.string().min(1),
  /// Null for images, and null when the browser could not read the metadata.
  durationSec: z
    .number()
    .int()
    .min(0)
    // 4 hours. Not a real limit, just a sanity bound — anything above this is
    // a browser reporting Infinity or a corrupt file, not a submission.
    .max(14_400)
    .nullable(),
  /// Set when this replaces a submission a teacher sent back.
  retryOfId: z.string().min(1).optional(),
  /// Set when recorded from a flashcard.
  wordId: z.string().min(1).optional(),
});

// --- Account ---------------------------------------------------------------

export const nameSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80, "Keep it under 80 characters"),
});

export const deleteAccountSchema = z.object({
  // Typed by hand, not a checkbox: deletion cannot be undone, and a tap is
  // too easy to make by accident on a phone.
  confirm: z.literal("DELETE", "Type DELETE in capitals to confirm"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
