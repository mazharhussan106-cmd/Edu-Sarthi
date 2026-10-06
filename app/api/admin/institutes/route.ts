// Owns the site admin's decisions on institutes: approve or reject an
// application, suspend a running institute, reinstate it. The rules and the
// admin log entry are in lib/institutes; this checks the caller and the input.
//
// Rejection and suspension require a reason, shown to the institute's admin.

import { NextResponse } from "next/server";

import { readBody, requireAdmin } from "@/lib/admin";
import { decideInstitute } from "@/lib/institutes";
import { adminInstituteSchema } from "@/lib/instituteSchemas";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const parsed = adminInstituteSchema.safeParse(await readBody(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  const a = parsed.data;
  const res = await decideInstitute(admin.id, a.id, a.action, "reason" in a ? a.reason : "");
  return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ ok: true });
}
