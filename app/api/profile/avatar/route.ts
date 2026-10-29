// Owns the profile photo API for the signed-in person: "upload" asks for a
// signed URL for the cropped file, "save" puts the uploaded file on the
// account, and DELETE removes the photo.
//
// Members only: a guest account is study-only and can vanish, so it gets no
// photo. Every action is about the caller's own account; there is no way to
// name someone else's.

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/apiUser";
import { avatarUploadTarget, removeAvatar, setAvatar } from "@/lib/avatar";
import { avatarFileSchema } from "@/lib/avatarFile";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("upload"), ...avatarFileSchema.shape }),
  z.object({ action: z.literal("save"), key: z.string().min(1).max(200) }),
]);

export async function POST(req: Request) {
  const gate = await requireUser({ member: true });
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Choose the photo again and try once more." }, { status: 400 });
  }

  if (parsed.data.action === "upload") {
    const target = await avatarUploadTarget(gate.id, parsed.data);
    return "error" in target ? NextResponse.json(target, { status: 503 }) : NextResponse.json(target);
  }
  const res = await setAvatar(gate.id, parsed.data.key);
  return "error" in res ? NextResponse.json(res, { status: 400 }) : NextResponse.json(res);
}

export async function DELETE() {
  const gate = await requireUser({ member: true });
  if (!gate.ok) return gate.res;
  await removeAvatar(gate.id);
  return NextResponse.json({ ok: true });
}
