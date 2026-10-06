// Owns liking and un-liking a library deck. One like per person; liking your
// own deck is refused so the count means other people's opinion.
//
// It deliberately does NOT return the whole deck — just the new count, so the
// button can update without a page reload.

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/decks";

const schema = z.object({ deckId: z.string().min(1), on: z.boolean() });
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return fail("Could not save that. Try again.", 400);
  const { deckId, on } = parsed.data;

  const deck = await prisma.deck.findFirst({ where: { id: deckId, visibility: "PUBLIC", status: "APPROVED" }, select: { ownerId: true } });
  if (!deck) return fail("That deck is not in the library any more.", 404);
  if (deck.ownerId === userId) return fail("You cannot like your own deck.", 400);

  if (on) {
    await prisma.deckLike.upsert({ where: { deckId_userId: { deckId, userId } }, create: { deckId, userId }, update: {} });
  } else {
    await prisma.deckLike.deleteMany({ where: { deckId, userId } });
  }
  return NextResponse.json({ ok: true, likes: await prisma.deckLike.count({ where: { deckId } }) });
}
