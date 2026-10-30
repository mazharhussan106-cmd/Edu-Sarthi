// Owns a student's writes on their study tabs (layer 1 of the Flashcard
// filters): make, rename, delete, arrange and hide tabs, choose the decks an
// own tab holds, and place one deck in tabs after a copy or import. GET lists
// the own tabs for the "Show this deck in which tabs?" sheet.
//
// Scoped to the signed-in student; the client never sends a user id, and
// every write names the student in its WHERE clause (lib/studyTabs). Students
// only: teachers and admins have no Flashcard tab, so GET answers "not for
// you" quietly and the copy flow simply skips the question. Guests are refused
// with the usual "add your email" message (their data can be merged away).
//
// It deliberately does NOT decide which decks a student may study; it asks
// lib/studyTabs, which uses the same rule as the study pages.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { readJson } from "@/lib/decks";
import { tabActionSchema } from "@/lib/studyTabSchemas";
import { arrangeTabs, createTab, deleteTab, ownTabs, placeDeck, removeDeck, renameTab, setTabDecks } from "@/lib/studyTabs";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET(req: Request) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;
  if (gate.role !== "STUDENT") return NextResponse.json({ enabled: false, tabs: [] });
  const deck = new URL(req.url).searchParams.get("deck") ?? undefined;
  // An id that is not one of ours just means "no deck": nothing is in it.
  const deckId = deck && /^[a-z0-9]{10,40}$/.test(deck) ? deck : undefined;
  return NextResponse.json({ enabled: true, tabs: await ownTabs(gate.id, deckId) });
}

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;
  if (gate.role !== "STUDENT") return fail("Study tabs are for student accounts. Teachers and admins have no Flashcard tab.", 403);
  const userId = gate.id;

  const parsed = tabActionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Could not save that. Check the fields and try again.", 400);
  const a = parsed.data;

  const r =
    a.action === "create"
      ? await createTab(userId, a.name)
      : a.action === "rename"
        ? await renameTab(userId, a.id, a.name)
        : a.action === "delete"
          ? await deleteTab(userId, a.id)
          : a.action === "arrange"
            ? await arrangeTabs(userId, a.tabs)
            : a.action === "setDecks"
              ? await setTabDecks(userId, a.id, a.deckIds)
              : a.action === "removeDeck"
                ? await removeDeck(userId, a.id, a.deckId)
                : await placeDeck(userId, a.deckId, a.tabIds, a.newTab);

  return "error" in r ? fail(r.error, 400) : NextResponse.json(r);
}
