// Owns the shape of every announcement request from the admin page: write a
// draft, send a test, start, stop, delete. Shared by the form (instant
// feedback) and the API (enforcement).
//
// It deliberately holds no database code and no sending rules —
// lib/announcements decides those.

import { z } from "zod";

export const announcementDraftSchema = z.object({
  subject: z.string().trim().min(5, "Write a subject of at least 5 characters.").max(120, "Keep the subject under 120 characters."),
  body: z.string().trim().min(20, "Write the email itself: at least a couple of lines.").max(5000, "Keep the email under 5,000 characters."),
  notice: z.string().trim().min(10, "Write the short dashboard notice: one or two sentences.").max(300, "Keep the dashboard notice under 300 characters."),
});

export const announcementActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...announcementDraftSchema.shape }),
  z.object({ action: z.literal("delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("test"), id: z.string().min(1) }),
  z.object({ action: z.literal("start"), id: z.string().min(1) }),
  z.object({ action: z.literal("stop"), id: z.string().min(1) }),
]);
