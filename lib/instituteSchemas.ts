// Owns the shape of every institute request: applying, joining, managing
// members, the logo, and the site admin's decisions. Shared by the forms
// (instant feedback) and the API (enforcement).
//
// It deliberately holds no database code and no rules about who may do what —
// lib/institutes decides that.

import { z } from "zod";

/// The logo is small on every deck it marks, so 1 MB is plenty; the three
/// types are the pictures every phone and browser can show.
export const LOGO_LIMITS = { bytes: 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp"] } as const;

export const logoFileSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(LOGO_LIMITS.types, "Use a PNG, JPG or WebP picture for the logo."),
  sizeBytes: z.number().int().positive("That file appears to be empty. Pick the logo file again.").max(LOGO_LIMITS.bytes, "The logo must be 1 MB or smaller. Shrink it first, then try again."),
});

export const applySchema = z.object({
  name: z.string().trim().min(3, "Enter the institute’s name (at least 3 characters)").max(100, "Keep the name under 100 characters"),
  description: z.string().trim().min(20, "Say in a couple of lines what the institute teaches and who it is for").max(600, "Keep it under 600 characters"),
  contact: z.string().trim().min(5, "Enter a phone number or email we can reach you on").max(120),
});

export const instituteActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("apply"), ...applySchema.shape }),
  z.object({ action: z.literal("join"), code: z.string().trim().toUpperCase().min(6, "Enter the full join code").max(12) }),
  z.object({ action: z.literal("leave") }),
  z.object({ action: z.literal("removeMember"), userId: z.string().min(1) }),
  z.object({ action: z.literal("setRole"), userId: z.string().min(1), role: z.enum(["TEACHER", "STUDENT"]) }),
  z.object({ action: z.literal("newCode") }),
  z.object({ action: z.literal("shareDeck"), deckId: z.string().min(1) }),
  z.object({ action: z.literal("unshareDeck"), deckId: z.string().min(1) }),
  z.object({ action: z.literal("removeName"), deckId: z.string().min(1) }),
  z.object({ action: z.literal("logoUpload"), ...logoFileSchema.shape }),
  z.object({ action: z.literal("setLogo"), key: z.string().min(1).max(200) }),
  z.object({ action: z.literal("removeLogo") }),
]);

export const adminInstituteSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), id: z.string().min(1) }),
  z.object({ action: z.literal("reject"), id: z.string().min(1), reason: z.string().trim().min(3, "Write a short reason the applicant can act on").max(500) }),
  z.object({ action: z.literal("suspend"), id: z.string().min(1), reason: z.string().trim().min(3, "Write a short reason").max(500) }),
  z.object({ action: z.literal("reinstate"), id: z.string().min(1) }),
  z.object({ action: z.literal("approveLogo"), id: z.string().min(1) }),
  z.object({ action: z.literal("rejectLogo"), id: z.string().min(1), reason: z.string().trim().min(3, "Write a short reason the institute can act on").max(300) }),
]);
