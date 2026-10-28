// Owns the three requests behind "Profile photo" in Settings: an upload
// address for the shrunk picture, saving the uploaded file as the photo, and
// removing it. The rules (file check, who sees it, admin approval for
// teachers) live in lib/avatar.
//
// It deliberately takes no user id from the request: the photo is always the
// session's own, and the key must be one this account was issued.

import { NextResponse } from "next/server";

import { avatarActionSchema } from "@/lib/accountSchemas";
import { requireUser } from "@/lib/apiUser";
import { avatarUploadTarget, removeAvatar, saveAvatar } from "@/lib/avatar";

export async function POST(req: Request) {
  // Guests are study-only and have no profile to put a photo on.
  const gate = await requireUser({ member: true });
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Refresh the page and try again." }, { status: 400 });
  }
  const parsed = avatarActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Choose a JPG, PNG or WebP photo." }, { status: 400 });
  }
  const a = parsed.data;

  if (a.action === "upload") {
    const target = await avatarUploadTarget(gate.id, a.contentType);
    return "error" in target ? NextResponse.json({ error: target.error }, { status: 503 }) : NextResponse.json({ key: target.key, url: target.url });
  }
  const res = a.action === "save" ? await saveAvatar(gate.id, a.key) : await removeAvatar(gate.id);
  return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ ok: true });
}
