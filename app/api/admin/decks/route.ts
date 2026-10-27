// Owns the admin's decisions on public decks: approve or reject a deck (or a
// new version) waiting for review, dismiss or act on reports, and accept or
// undo a small fix that went live without waiting (lib/smallFix).
//
// Rejections and takedowns require a reason — it is shown to the deck's owner
// so they know what to fix, and kept in the admin log. The state rules are in
// lib/deckReview; this route only checks the caller and the input.

import { NextResponse } from "next/server";
import { z } from "zod";

import { readBody, requireAdmin } from "@/lib/admin";
import { resolveReports, reviewDeck } from "@/lib/deckReview";
import { acceptFix, undoFix } from "@/lib/smallFix";

const reason = z.string().trim().min(3, "Write a short reason the owner can act on").max(500);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), id: z.string().min(1) }),
  z.object({ action: z.literal("reject"), id: z.string().min(1), reason }),
  z.object({ action: z.literal("dismiss"), id: z.string().min(1) }),
  z.object({ action: z.literal("takedown"), id: z.string().min(1), reason }),
  z.object({ action: z.literal("acceptFix"), id: z.string().min(1) }),
  z.object({ action: z.literal("undoFix"), id: z.string().min(1), reason }),
]);

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const parsed = schema.safeParse(await readBody(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  const a = parsed.data;

  const res =
    a.action === "approve" ? await reviewDeck(admin.id, a.id, "approve", "")
    : a.action === "reject" ? await reviewDeck(admin.id, a.id, "reject", a.reason)
    : a.action === "dismiss" ? await resolveReports(admin.id, a.id, "dismiss", "")
    : a.action === "acceptFix" ? await acceptFix(admin.id, a.id)
    : a.action === "undoFix" ? await undoFix(admin.id, a.id, a.reason)
    : await resolveReports(admin.id, a.id, "takedown", a.reason);
  return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ ok: true });
}
