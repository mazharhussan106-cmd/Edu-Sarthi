// Owns an institute's logo: its admin uploading one, the site admin approving
// or refusing it, the admin taking it down, and turning the approved logo into
// a URL a page can draw beside the institute's name on its library decks.
//
// A new upload waits in pendingLogoKey until the site admin approves it, so a
// logo nobody has checked never appears on a public page. The approved logo
// keeps showing while a replacement waits.
//
// It deliberately does NOT check request shapes (lib/instituteSchemas) or
// decide who belongs to an institute (lib/institutes).

import { cache } from "react";
import type { z } from "zod";

import { logAdmin } from "@/lib/admin";
import { asAdmin } from "@/lib/institutes";
import type { logoFileSchema } from "@/lib/instituteSchemas";
import { prisma } from "@/lib/prisma";
import { createUploadTarget, isOwnKey, objectExists, removeObjects, resolveMediaUrl, type UploadTarget } from "@/lib/storage";

type Result = { ok: true } | { error: string };
type LogoFile = z.infer<typeof logoFileSchema>;

const NOT_ADMIN = "Only the institute’s admin can change its logo.";

/// The signed upload URL for a new logo. Type and size were checked by
/// logoFileSchema before this runs: once the URL is handed over, the browser
/// can send what it likes, and the site admin still looks at every logo.
export async function logoUploadTarget(userId: string, f: LogoFile): Promise<UploadTarget | { error: string }> {
  if (!(await asAdmin(userId))) return { error: NOT_ADMIN };
  try {
    return await createUploadTarget(userId, f.filename);
  } catch {
    return { error: "Uploads are not working right now. Try again later." };
  }
}

/// Puts an uploaded file in the queue for the site admin. A logo already
/// waiting is replaced, and its file deleted.
export async function submitLogo(userId: string, key: string): Promise<Result> {
  const a = await asAdmin(userId);
  if (!a) return { error: NOT_ADMIN };
  // Only a key this person was issued, and only once the file is really there.
  if (!isOwnKey(userId, key) || !(await objectExists(key))) return { error: "The logo did not upload. Check your connection and choose the file again." };
  const before = await prisma.institute.findUnique({ where: { id: a.instituteId }, select: { pendingLogoKey: true } });
  await prisma.institute.update({ where: { id: a.instituteId }, data: { pendingLogoKey: key, logoNote: null } });
  if (before?.pendingLogoKey && before.pendingLogoKey !== key) await removeObjects([before.pendingLogoKey]);
  return { ok: true };
}

/// Takes the logo off every deck at once, and drops one still waiting.
export async function removeLogo(userId: string): Promise<Result> {
  const a = await asAdmin(userId);
  if (!a) return { error: NOT_ADMIN };
  const before = await prisma.institute.findUnique({ where: { id: a.instituteId }, select: { logoKey: true, pendingLogoKey: true } });
  await prisma.institute.update({ where: { id: a.instituteId }, data: { logoKey: null, pendingLogoKey: null, logoNote: null } });
  await removeObjects([before?.logoKey, before?.pendingLogoKey].filter((k): k is string => Boolean(k)));
  return { ok: true };
}

export async function decideLogo(adminId: string, id: string, approve: boolean, reason: string): Promise<Result> {
  const inst = await prisma.institute.findUnique({ where: { id }, select: { name: true, logoKey: true, pendingLogoKey: true } });
  if (!inst?.pendingLogoKey) return { error: "That logo is not waiting any more. Refresh the page." };
  const res = await prisma.institute.updateMany({
    // Only the file the admin looked at: a newer upload in between is decided
    // on its own, not approved unseen.
    where: { id, pendingLogoKey: inst.pendingLogoKey },
    data: approve ? { logoKey: inst.pendingLogoKey, pendingLogoKey: null, logoNote: null } : { pendingLogoKey: null, logoNote: reason },
  });
  if (!res.count) return { error: "The institute uploaded a different logo meanwhile. Refresh the page and look again." };
  // After the save, so a failed delete leaves an orphaned file, never a broken logo.
  const old = approve ? inst.logoKey : inst.pendingLogoKey;
  if (old) await removeObjects([old]);
  await logAdmin(adminId, approve ? "Approved institute logo" : "Refused institute logo", "institute", id, { name: inst.name, ...(approve ? {} : { reason }) });
  return { ok: true };
}

/// One signed URL per logo per page view, however many of the institute's
/// decks a list shows.
export const logoUrl = cache(async (key: string): Promise<string | null> => resolveMediaUrl(key));
