// Owns what a signed-in person does with an institute: apply for one, join one
// with a code, leave, and — for an institute's admin — manage members, rotate
// the join code, and share decks inside it.
//
// The caller's identity comes from the session only; the client never names a
// user for itself. Every rule is in lib/institutes.
// It deliberately does NOT approve institutes — that is /api/admin/institutes.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { readJson } from "@/lib/decks";
import {
  applyInstitute, joinInstitute, leaveInstitute, removeMember, rotateJoinCode, setMemberRole, shareDeck, unshareDeck,
} from "@/lib/institutes";
import { instituteActionSchema } from "@/lib/instituteSchemas";

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  const parsed = instituteActionSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the fields and try again." }, { status: 400 });
  const a = parsed.data;

  const res =
    a.action === "apply" ? await applyInstitute(userId, { name: a.name, description: a.description, contact: a.contact })
    : a.action === "join" ? await joinInstitute(userId, a.code)
    : a.action === "leave" ? await leaveInstitute(userId)
    : a.action === "removeMember" ? await removeMember(userId, a.userId)
    : a.action === "setRole" ? await setMemberRole(userId, a.userId, a.role)
    : a.action === "newCode" ? await rotateJoinCode(userId)
    : a.action === "shareDeck" ? await shareDeck(userId, a.deckId)
    : await unshareDeck(userId, a.deckId);
  return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ ok: true });
}
