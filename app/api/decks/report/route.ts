// Owns a reader reporting a public deck. One report per person per deck; the
// rules about hiding and review live in lib/deckReview.
//
// It deliberately does NOT remove anything itself — a report is a request for
// an admin to look, never a verdict.

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { readJson } from "@/lib/decks";
import { reportDeck } from "@/lib/deckReview";
import { reportSchema } from "@/lib/deckSchemas";

export async function POST(req: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  const parsed = reportSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Choose a reason and try again." }, { status: 400 });
  const res = await reportDeck(userId, parsed.data.deckId, parsed.data.reason, parsed.data.note);
  return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ ok: true });
}
