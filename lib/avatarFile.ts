// Owns the rules for a profile photo file, shared by the browser (to say what
// is wrong before anything is sent) and the API (which enforces them).
//
// The browser crops the picture to a square and draws it again at 512 × 512
// before upload. Drawing it again is what removes the camera's hidden data
// (GPS position, phone model) and keeps the file small on mobile data. So the
// upload is always WebP or JPEG and small; the picked file only has to be a
// picture the browser can open. It deliberately has no server imports.

import { z } from "zod";

export const AVATAR_PX = 512;

/// What may be picked from the phone: the browser opens it, crops it and
/// makes a new file, so this only stops something absurd before it is opened.
export const PICK_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PICK_MAX_BYTES = 15 * 1024 * 1024;

/// A 512 × 512 WebP or JPEG is far below this; the server checks the stored
/// file against it too, not only the size the browser reports.
export const AVATAR_MAX_BYTES = 600 * 1024;

/// What may be uploaded: the browser's own re-drawn 512 × 512 file.
export const avatarFileSchema = z.object({
  contentType: z.enum(["image/webp", "image/jpeg"], "Only the cropped photo can be uploaded. Choose the photo again."),
  sizeBytes: z.number().int().positive("That photo came out empty. Choose it again.").max(AVATAR_MAX_BYTES, "That photo is too large after cropping. Choose a different one."),
});

export function pickProblem(file: { type: string; size: number }): string | null {
  if (!(PICK_TYPES as readonly string[]).includes(file.type)) return "Choose a JPG, PNG or WebP photo.";
  if (file.size > PICK_MAX_BYTES) return "That photo is over 15 MB. Choose a smaller one.";
  return null;
}
