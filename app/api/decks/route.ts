// Owns a student's writes on their decks: create, rename, delete, turn the
// share link on or off, and copy a deck that was shared with them.
//
// Scoped to the signed-in student; the client never sends a user id, and every
// write names the owner in its WHERE clause.
//
// It deliberately does NOT touch cards (that is /api/decks/[id]/cards) or make
// anything public — the public library and its admin review are a later phase.

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { copySharedDeck, deleteDeck, newShareToken, ownDeck, readJson } from "@/lib/decks";
import { DECK_LIMITS, deckActionSchema } from "@/lib/deckSchemas";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) return fail("Your session has expired. Sign in again.", 401);

  const parsed = deckActionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Could not save that. Check the fields and try again.", 400);
  const a = parsed.data;

  if (a.action === "create") {
    // Counted before the insert, outside any transaction: a race can overshoot
    // by one deck, which is harmless; the limit exists to stop runaway growth.
    if ((await prisma.deck.count({ where: { ownerId: userId } })) >= DECK_LIMITS.decksPerUser) {
      return fail(`You can have ${DECK_LIMITS.decksPerUser} decks. Delete one you no longer need, then try again.`, 400);
    }
    const deck = await prisma.deck.create({
      data: { ownerId: userId, title: a.title, description: a.description || null, tags: a.tags },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: deck.id });
  }

  if (a.action === "copy") {
    const res = await copySharedDeck(userId, a.token);
    return "error" in res ? fail(res.error, 400) : NextResponse.json({ ok: true, id: res.id });
  }

  if (a.action === "delete") {
    return (await deleteDeck(userId, a.id)) ? NextResponse.json({ ok: true }) : fail("That deck no longer exists.", 404);
  }

  const deck = await ownDeck(userId, a.id);
  if (!deck) return fail("That deck no longer exists.", 404);

  if (a.action === "update") {
    await prisma.deck.updateMany({
      where: { id: a.id, ownerId: userId },
      data: { title: a.title, description: a.description || null, tags: a.tags },
    });
    return NextResponse.json({ ok: true });
  }

  // share: turning it off clears the token, which revokes every copy of the
  // link; turning it on again issues a fresh one rather than reviving the old.
  const token = a.on ? newShareToken() : null;
  if (a.on && deck.shareToken) return NextResponse.json({ ok: true, token: deck.shareToken });
  await prisma.deck.updateMany({
    where: { id: a.id, ownerId: userId },
    data: { shareToken: token, visibility: a.on ? "LINK" : "PRIVATE" },
  });
  return NextResponse.json({ ok: true, token });
}
