// Owns the site admin's decision on a teacher's photo: approve it (students
// then see it on audits) or refuse it with a reason the teacher reads. The
// rules and the admin log entry are in lib/avatar; this checks the caller and
// the input.

import { NextResponse } from "next/server";

import { adminPhotoSchema } from "@/lib/accountSchemas";
import { readBody, requireAdmin } from "@/lib/admin";
import { decidePhoto } from "@/lib/avatar";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const parsed = adminPhotoSchema.safeParse(await readBody(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  const a = parsed.data;
  const res = await decidePhoto(admin.id, a.id, a.key, a.action === "approve", a.action === "refuse" ? a.reason : "");
  return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ ok: true });
}
