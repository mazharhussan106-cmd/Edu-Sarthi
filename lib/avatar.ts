// Owns a person's profile photo on the server: a signed upload URL for the
// cropped file, putting the uploaded file on the account (and deleting the
// photo it replaces), removing it, and a short-lived URL to show it.
//
// The photo is shown only on its owner's Profile (owner's decision, 29 Oct
// 2026). Nobody else is ever given a URL for it, which is why there is no
// approval queue as there is for institute logos: nobody else can see it to
// be harmed by it. Guests cannot add one.
//
// It deliberately does NOT check request shapes (lib/avatarFile) or crop
// anything (the browser does).

import type { z } from "zod";

import { AVATAR_MAX_BYTES, type avatarFileSchema } from "@/lib/avatarFile";
import { prisma } from "@/lib/prisma";
import { createUploadTarget, isOwnKey, objectInfo, removeObjects, resolveMediaUrl, type UploadTarget } from "@/lib/storage";

type Result = { ok: true } | { error: string };

export async function avatarUploadTarget(userId: string, f: z.infer<typeof avatarFileSchema>): Promise<UploadTarget | { error: string }> {
  try {
    return await createUploadTarget(userId, f.contentType === "image/webp" ? "photo.webp" : "photo.jpg");
  } catch {
    return { error: "Photo uploads are not working right now. Try again later." };
  }
}

/// Puts an uploaded file on the account. The old photo's file is deleted after
/// the row points at the new one, so a failed delete leaves an unused file,
/// never an account whose photo is missing.
export async function setAvatar(userId: string, key: string): Promise<Result> {
  // Only a key this person was issued, and only once the file is really there.
  if (!isOwnKey(userId, key)) return { error: "The photo did not upload. Check your connection and try again." };
  const info = await objectInfo(key);
  if (!info) return { error: "The photo did not upload. Check your connection and try again." };
  // What arrived, not what the browser promised. "unknown" (a store that
  // cannot say) is let through rather than breaking every photo save.
  if (info !== "unknown" && (info.size === 0 || info.size > AVATAR_MAX_BYTES || !["image/webp", "image/jpeg"].includes(info.contentType))) {
    await removeObjects([key]);
    return { error: "That file is not a cropped photo. Choose your photo again." };
  }
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
  await prisma.user.update({ where: { id: userId }, data: { avatarKey: key } });
  if (before?.avatarKey && before.avatarKey !== key) await removeObjects([before.avatarKey]);
  return { ok: true };
}

export async function removeAvatar(userId: string): Promise<Result> {
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
  if (!before?.avatarKey) return { ok: true };
  await prisma.user.update({ where: { id: userId }, data: { avatarKey: null } });
  await removeObjects([before.avatarKey]);
  return { ok: true };
}

/// A URL that works for about half an hour, made for one page view. Never
/// call this for anyone but the person looking at their own Profile.
export async function avatarUrl(key: string | null): Promise<string | null> {
  return key ? resolveMediaUrl(key) : null;
}
