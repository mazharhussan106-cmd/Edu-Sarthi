// Owns profile photos: the upload address, saving and removing a photo, the
// admin's check of a teacher's photo, and who may see whose photo.
//
// Who sees what (owner's decision N9): a student's photo is seen only by that
// student. A teacher's photo is shown to students, but only after an admin has
// checked it (avatarApprovedAt), because many students are under 18; until
// then students see nothing new. An admin's own photo needs no check. A new
// upload clears the approval, so a checked photo can never be swapped unseen.
//
// It deliberately does NOT resize (the browser shrinks the picture to 256×256
// before upload, components/settings AvatarForm) and does not render
// (components/ui/Avatar). Request shapes live in lib/accountSchemas.

import { cache } from "react";
import type { Role } from "@prisma/client";

import { logAdmin } from "@/lib/admin";
import { AVATAR_LIMITS } from "@/lib/accountSchemas";
import { readObjectBytes } from "@/lib/mediaBytes";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { createUploadTarget, isOwnKey, objectExists, removeObjects, resolveMediaUrl, type UploadTarget } from "@/lib/storage";

type Result = { ok: true } | { error: string };
type ImageType = (typeof AVATAR_LIMITS.types)[number];

const EXT: Record<ImageType, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
const STAFF: readonly Role[] = ["TEACHER", "ADMIN"];

/// One signed URL per photo per page view, however often a page shows it.
export const photoUrl = cache(async (key: string): Promise<string | null> => resolveMediaUrl(key));

export async function avatarUploadTarget(userId: string, contentType: ImageType): Promise<UploadTarget | { error: string }> {
  try {
    return await createUploadTarget(userId, `avatar.${EXT[contentType]}`);
  } catch {
    return { error: "Uploads are not working right now. Try again later." };
  }
}

/// True when the first bytes are a JPEG, PNG or WebP. The upload address lets
/// the browser send anything, so the file itself is checked, not its name.
function looksLikeImage(b: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && ascii(1, 4) === "PNG";
  const webp = ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  return jpeg || png || webp;
}

export async function saveAvatar(userId: string, key: string): Promise<Result> {
  if (!isOwnKey(userId, key) || !(await objectExists(key))) return { error: "The photo did not upload. Check your connection and choose it again." };
  const bytes = await readObjectBytes(key, AVATAR_LIMITS.bytes, () => new Error("too large"));
  if (!bytes || !looksLikeImage(new Uint8Array(bytes))) {
    await removeObjects([key]);
    return { error: "That file is not a picture we can use. Choose a JPG, PNG or WebP photo up to 1 MB." };
  }
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, avatarKey: true } });
  if (!before) return { error: "Your session has expired. Sign in again." };
  await prisma.user.update({
    where: { id: userId },
    data: { avatarKey: key, avatarApprovedAt: before.role === "ADMIN" ? new Date() : null, avatarNote: null },
  });
  // After the save, so a failed delete leaves an orphaned file, never a missing photo.
  if (before.avatarKey && before.avatarKey !== key) await removeObjects([before.avatarKey]);
  return { ok: true };
}

export async function removeAvatar(userId: string): Promise<Result> {
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
  await prisma.user.update({ where: { id: userId }, data: { avatarKey: null, avatarApprovedAt: null, avatarNote: null } });
  if (before?.avatarKey) await removeObjects([before.avatarKey]);
  return { ok: true };
}

/// The person's own photo, for their Profile and Settings, with where it stands.
export async function ownPhoto(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, avatarKey: true, avatarApprovedAt: true, avatarNote: true } });
  if (!u) return null;
  return {
    url: u.avatarKey ? await photoUrl(u.avatarKey) : null,
    /// Null for a student: their photo is never shown to anyone else. Staff
    /// photos appear on the audits they write, a teacher's once checked.
    shownToStudents: u.role === "STUDENT" ? null : !u.avatarKey ? ("no" as const) : u.avatarApprovedAt ? ("yes" as const) : ("waiting" as const),
    note: u.avatarNote,
  };
}

/// A staff member's photo as a student may see it: checked, or nothing.
export async function staffPhotoForStudents(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, avatarKey: true, avatarApprovedAt: true } });
  if (!u?.avatarKey || !u.avatarApprovedAt || !STAFF.includes(u.role)) return null;
  return photoUrl(u.avatarKey);
}

/// Teachers' photos the admin has not checked yet, oldest account first.
export async function photosToCheck() {
  const rows = await prisma.user.findMany({
    where: { role: "TEACHER", avatarKey: { not: null }, avatarApprovedAt: null },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: { id: true, name: true, publicId: true, avatarKey: true },
  });
  return Promise.all(rows.map(async (r) => ({ ...r, avatarKey: r.avatarKey!, url: await photoUrl(r.avatarKey!) })));
}

export async function decidePhoto(adminId: string, userId: string, key: string, approve: boolean, reason: string): Promise<Result> {
  // Only the photo the admin looked at, and only while it still waits.
  const res = await prisma.user.updateMany({
    where: { id: userId, role: "TEACHER", avatarKey: key, avatarApprovedAt: null },
    data: approve ? { avatarApprovedAt: new Date(), avatarNote: null } : { avatarKey: null, avatarNote: reason },
  });
  if (!res.count) return { error: "That photo is not waiting any more, or the teacher uploaded a new one. Refresh the page." };
  if (!approve) await removeObjects([key]);
  await logAdmin(adminId, approve ? "Approved teacher photo" : "Refused teacher photo", "user", userId, approve ? {} : { reason });
  await notify(userId, approve ? "photo_approved" : "photo_refused", {
    title: approve ? "Your photo was approved" : "Your photo was not approved",
    body: approve ? "Students now see your photo on the audits you write." : `Reason: ${reason} You can upload a different photo in Settings.`,
    link: "/settings#photo",
  });
  return { ok: true };
}
