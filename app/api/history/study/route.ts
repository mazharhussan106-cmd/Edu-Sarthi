// Owns one thing: a student deleting their own study history (ReviewLog rows).
//
// The user id comes from the session, never the request, so no one can name
// another account. It deliberately leaves CardState alone: deleting the log must
// not reset a card's review date or the streak.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { deleteStudyHistory } from "@/lib/history";

export async function DELETE() {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;
  const removed = await deleteStudyHistory(gate.id);
  return NextResponse.json({ ok: true, removed });
}
