// Owns the shape of every institute request: applying, joining, managing
// members. Shared by the forms (instant feedback) and the API (enforcement).
//
// It deliberately holds no database code and no rules about who may do what —
// lib/institutes decides that.

import { z } from "zod";

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
]);

export const adminInstituteSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), id: z.string().min(1) }),
  z.object({ action: z.literal("reject"), id: z.string().min(1), reason: z.string().trim().min(3, "Write a short reason the applicant can act on").max(500) }),
  z.object({ action: z.literal("suspend"), id: z.string().min(1), reason: z.string().trim().min(3, "Write a short reason").max(500) }),
  z.object({ action: z.literal("reinstate"), id: z.string().min(1) }),
]);
