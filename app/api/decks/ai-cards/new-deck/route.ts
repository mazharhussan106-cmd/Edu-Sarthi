// Owns starting a brand-new deck from the cards the AI made: it creates the
// deck and its cards together, so either both exist or neither does. The cards
// are saved exactly as when they are added to an existing deck
// (lib/aiCardRows), including the AI-assisted mark and the chapters.
//
// It deliberately does NOT call the model or touch the AI allowance; that was
// spent when the cards were made. It counts against the same 20-decks limit as
// any new deck.

import { NextResponse } from "next/server";

import { aiCardRows } from "@/lib/aiCardRows";
import { newAiDeckSchema } from "@/lib/aiCardSchemas";
import { requireUser } from "@/lib/apiUser";
import { LimitReached, lockUser, readJson } from "@/lib/decks";
import { DECK_LIMITS } from "@/lib/deckSchemas";
import { prisma } from "@/lib/prisma";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  const parsed = newAiDeckSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the deck name and the cards, then try again.", 400);
  const { title, cards } = parsed.data;

  try {
    const deck = await prisma.$transaction(
      async (tx) => {
        // The same per-user lock the deck and card routes take, so this cannot
        // pass the deck limit together with another request.
        await lockUser(tx, userId);
        if ((await tx.deck.count({ where: { ownerId: userId, draftOfId: null } })) >= DECK_LIMITS.decksPerUser) throw new LimitReached();
        const created = await tx.deck.create({ data: { ownerId: userId, title, tags: [] }, select: { id: true } });
        await tx.word.createMany({ data: aiCardRows(userId, created.id, 1, cards) });
        return created;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
    return NextResponse.json({ ok: true, id: deck.id });
  } catch (e) {
    if (e instanceof LimitReached) {
      return fail(`You can have ${DECK_LIMITS.decksPerUser} decks. Delete one you no longer need, then try again.`, 400);
    }
    throw e;
  }
}
