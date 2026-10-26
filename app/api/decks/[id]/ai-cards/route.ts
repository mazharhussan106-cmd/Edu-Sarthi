// Owns adding the cards the AI made (after the person has read, edited and
// chosen them) to one of their decks. Each card is saved with its chapter in
// `category` and marked `aiAssisted` in its details, so the label is set here
// on the server and not left to the browser.
//
// It deliberately does NOT call the model or touch the AI allowance; that was
// spent when the cards were made (/api/decks/ai-cards/make). Pictures and
// recordings are not part of this route; a card can get them later with Edit.

import { NextResponse } from "next/server";

import { addAiCardsSchema } from "@/lib/aiCardSchemas";
import { requireUser } from "@/lib/apiUser";
import { aiCardRows } from "@/lib/aiCardRows";
import { LimitReached, lockUser, ownDeck, readJson } from "@/lib/decks";
import { sendBackIfPublished } from "@/lib/deckReview";
import { DECK_LIMITS } from "@/lib/deckSchemas";
import { prisma } from "@/lib/prisma";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;
  const { id: deckId } = await params;

  const parsed = addAiCardsSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the cards and try again.", 400);
  const { cards } = parsed.data;

  if (!(await ownDeck(userId, deckId))) return fail("That deck no longer exists.", 404);
  const mine = { deckId, ownerId: userId };

  // A published deck goes back to review when its cards change, as for any edit.
  await sendBackIfPublished(deckId);
  try {
    await prisma.$transaction(
      async (tx) => {
        // Count and insert under the same per-user lock the single-card route
        // uses, so the two cannot together pass the deck's card limit.
        await lockUser(tx, userId);
        const have = await tx.word.count({ where: mine });
        if (have + cards.length > DECK_LIMITS.cardsPerDeck) throw new LimitReached();
        const last = await tx.word.findFirst({ where: mine, orderBy: { serial: "desc" }, select: { serial: true } });
        const first = (last?.serial ?? 0) + 1;
        await tx.word.createMany({ data: aiCardRows(userId, deckId, first, cards) });
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
  } catch (e) {
    if (e instanceof LimitReached) {
      return fail(`A deck holds up to ${DECK_LIMITS.cardsPerDeck} cards. Add fewer cards, or start a new deck.`, 400);
    }
    throw e;
  }
  return NextResponse.json({ ok: true, added: cards.length });
}
