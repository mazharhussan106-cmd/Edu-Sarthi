// Owns writes on the cards inside one of the student's decks: add, edit,
// delete. A card is a Word row with the deck and owner set.
//
// Media arrives as storage keys the browser got from /api/decks/media. A key
// is accepted only if it carries this user's prefix AND the file really
// exists — otherwise a client could point a card at someone else's recording
// or at a file whose upload never finished.
//
// It deliberately does NOT issue upload URLs or decide the deck's sharing.

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newCardCode, ownDeck, readJson, wordData } from "@/lib/decks";
import { sendBackIfPublished } from "@/lib/deckReview";
import { DECK_LIMITS, cardActionSchema } from "@/lib/deckSchemas";
import { objectExists, removeObjects } from "@/lib/storage";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

async function badKey(userId: string, key: string | null, current: string | null): Promise<boolean> {
  if (!key || key === current) return false; // unchanged or cleared
  return !key.startsWith(`${userId}/`) || !(await objectExists(key));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = (await auth())?.user?.id;
  if (!userId) return fail("Your session has expired. Sign in again.", 401);
  const { id: deckId } = await params;

  const parsed = cardActionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Could not save that card. Check the fields and try again.", 400);
  const a = parsed.data;

  if (!(await ownDeck(userId, deckId))) return fail("That deck no longer exists.", 404);
  const mine = { deckId, ownerId: userId };

  if (a.action === "delete") {
    const card = await prisma.word.findFirst({ where: { id: a.cardId, ...mine }, select: { imageUrl: true, audioUrl: true } });
    if (!card) return fail("That card no longer exists.", 404);
    await prisma.word.deleteMany({ where: { id: a.cardId, ...mine } });
    await removeObjects([card.imageUrl, card.audioUrl].filter((k): k is string => Boolean(k)));
    await sendBackIfPublished(deckId);
    return NextResponse.json({ ok: true });
  }

  const current = a.action === "edit" ? await prisma.word.findFirst({ where: { id: a.cardId, ...mine }, select: { imageUrl: true, audioUrl: true } }) : null;
  if (a.action === "edit" && !current) return fail("That card no longer exists.", 404);

  if ((await badKey(userId, a.imageKey, current?.imageUrl ?? null)) || (await badKey(userId, a.audioKey, current?.audioUrl ?? null))) {
    return fail("A picture or recording did not finish uploading. Add it again and save.", 400);
  }

  if (a.action === "add") {
    if ((await prisma.word.count({ where: mine })) >= DECK_LIMITS.cardsPerDeck) {
      return fail(`A deck holds up to ${DECK_LIMITS.cardsPerDeck} cards. Start a new deck for more.`, 400);
    }
    const last = await prisma.word.findFirst({ where: mine, orderBy: { serial: "desc" }, select: { serial: true } });
    const card = await prisma.word.create({
      data: { ...wordData(a), code: newCardCode(), serial: (last?.serial ?? 0) + 1, kind: "WORD", deckId, ownerId: userId },
      select: { id: true },
    });
    await sendBackIfPublished(deckId);
    return NextResponse.json({ ok: true, id: card.id });
  }

  await prisma.word.updateMany({ where: { id: a.cardId, ...mine }, data: wordData(a) });
  // Files the card no longer points at are removed after the row is saved.
  const dropped = [
    current!.imageUrl && current!.imageUrl !== a.imageKey ? current!.imageUrl : null,
    current!.audioUrl && current!.audioUrl !== a.audioKey ? current!.audioUrl : null,
  ].filter((k): k is string => Boolean(k));
  await removeObjects(dropped);
  await sendBackIfPublished(deckId);
  return NextResponse.json({ ok: true });
}
