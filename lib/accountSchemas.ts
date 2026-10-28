// Owns the request shapes for changing the sign-in email and the phone number.
// The same schemas check the Settings forms in the browser (instant feedback)
// and the routes on the server (enforcement).
//
// It deliberately holds no rules that need the database: whether an address
// is taken, the 60-second wait and the 3-changes-in-30-days limit live in
// lib/emailChange, and are never revealed by these messages.

import { z } from "zod";

import { email, phoneNumber } from "@/lib/validations";

const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from the email");

export const emailChangeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    newEmail: email,
    // Optional here because accounts without a password prove themselves with
    // a code to their current address instead; the server decides which.
    password: z.string().max(200).optional(),
  }),
  z.object({
    action: z.literal("confirm"),
    code,
    currentCode: code.optional(),
  }),
]);

export const phoneSchema = z.object({
  // Empty means "remove my number".
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(phoneNumber.or(z.literal(""))),
});

export type EmailChangeInput = z.infer<typeof emailChangeSchema>;

/// The browser shrinks a photo to 256×256 before upload, so a real one is a
/// few tens of KB; 1 MB leaves room for an older phone's PNG.
export const AVATAR_LIMITS = { bytes: 1024 * 1024, types: ["image/webp", "image/jpeg", "image/png"] } as const;

export const avatarActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("upload"),
    contentType: z.enum(AVATAR_LIMITS.types, "Use a JPG, PNG or WebP picture."),
    sizeBytes: z.number().int().positive("That picture appears to be empty. Choose it again.").max(AVATAR_LIMITS.bytes, "That picture is too large. Choose a smaller one."),
  }),
  z.object({ action: z.literal("save"), key: z.string().min(1).max(200) }),
  z.object({ action: z.literal("remove") }),
]);

/// The admin's decision on a teacher's photo. `key` is the photo the admin
/// looked at, so a newer upload in between is never approved unseen.
export const adminPhotoSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), id: z.string().min(1), key: z.string().min(1).max(200) }),
  z.object({ action: z.literal("refuse"), id: z.string().min(1), key: z.string().min(1).max(200), reason: z.string().trim().min(3, "Write a short reason the teacher can act on").max(300) }),
]);
