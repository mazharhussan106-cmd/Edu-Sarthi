// Owns the requests for sharing a deck with named people: invite, accept,
// decline, confirm (an editor of a public deck), remove and leave.
//
// Scoped to the signed-in person on every action; the rules and limits live in
// lib/deckMembers. It deliberately does NOT touch cards or the deck itself.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { readJson } from "@/lib/decks";
import { memberActionSchema } from "@/lib/deckSchemas";
import { acceptInvite, confirmEditing, declineInvite, inviteMember, leaveDeck, removeMember } from "@/lib/deckMembers";

export const revalidate = 0;

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  const parsed = memberActionSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });
  const a = parsed.data;

  const res =
    a.action === "invite" ? await inviteMember(userId, a.deckId, a.email, a.role)
    : a.action === "accept" ? await acceptInvite(userId, a.memberId, a.adult, a.terms)
    : a.action === "decline" ? await declineInvite(userId, a.memberId)
    : a.action === "confirm" ? await confirmEditing(userId, a.deckId, a.adult, a.terms)
    : a.action === "remove" ? await removeMember(userId, a.memberId)
    : await leaveDeck(userId, a.deckId);
  return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ ok: true });
}
