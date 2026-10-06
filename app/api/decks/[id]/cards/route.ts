// Owns writes on the cards inside one of the student's decks: add, edit,
// delete. A card is a Word row with the deck and owner set.
//
// Media arrives as storage keys the browser got from /api/decks/media. A key
// is accepted only if it carries this user's prefix AND the file really
// exists — otherwise a client could point a card at someone else's recording
// or at a file whose upload never finished.
//
// Video and the teacher's guide are staff-only. For a student the submitted
// values are ignored and a card's existing ones are kept — so a student editing
// a copied teacher card cannot erase its video, and cannot add one.
//
// It deliberately does NOT issue upload URLs or decide the deck's sharing.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { cardText, isStaff, LimitReached, lockUser, newCardCode, ownDeck, readJson, wordData } from "@/lib/decks";
import { sendBackIfPublished } from "@/lib/deckReview";
import { DECK_LIMITS, cardActionSchema } from "@/lib/deckSchemas";
import { objectExists, removeObjects, isOwnKey } from "@/lib/storage";
import { parseVideoUrl } from "@/lib/video";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

async function badKey(userId: string, key: string | null, current: string | null): Promise<boolean> {
  if (!key || key === current) return false; // unchanged or cleared
  return !isOwnKey(userId, key) || !(await objectExists(key));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireUser({ verified: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;
  const { id: deckId } = await params;

  const parsed = cardActionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Could not save that card. Check the fields and try again.", 400);
  const a = parsed.data;

  if (!(await ownDeck(userId, deckId))) return fail("That deck no longer exists.", 404);
  const mine = { deckId, ownerId: userId };

  if (a.action === "delete") {
    const card = await prisma.word.findFirst({ where: { id: a.cardId, ...mine }, select: { imageUrl: true, audioUrl: true } });
    if (!card) return fail("That card no longer exists.", 404);
    await sendBackIfPublished(deckId);
    await prisma.word.deleteMany({ where: { id: a.cardId, ...mine } });
    await removeObjects([card.imageUrl, card.audioUrl].filter((k): k is string => Boolean(k)));
    return NextResponse.json({ ok: true });
  }

  const current = a.action === "edit" ? await prisma.word.findFirst({ where: { id: a.cardId, ...mine }, select: { imageUrl: true, audioUrl: true, videoUrl: true, details: true } }) : null;
  if (a.action === "edit" && !current) return fail("That card no longer exists.", 404);
  // An imported 56-point card has dozens of fields this form cannot show;
  // saving it would overwrite them with four. Edit the Excel sheet instead.
  if (current && cardText(current).rich) return fail("This card came from an Excel file, so it cannot be edited here. Change it in the sheet and upload the file again.", 400);

  // Staff-only sections: staff's input (rebuilt as our own embed address), or
  // for everyone else the card's current values, or nothing for a new card.
  const staff = await isStaff(userId);
  const kept = current ? cardText(current) : { audit: "" };
  const extras = staff
    ? { videoUrl: (a.videoUrl && parseVideoUrl(a.videoUrl)) || "", audit: a.audit }
    : { videoUrl: current?.videoUrl ?? "", audit: kept.audit };

  if ((await badKey(userId, a.imageKey, current?.imageUrl ?? null)) || (await badKey(userId, a.audioKey, current?.audioUrl ?? null))) {
    return fail("A picture or recording did not finish uploading. Add it again and save.", 400);
  }

  if (a.action === "add") {
    // Limit check and insert under one per-user lock (see lockUser), and the
    // new card's number taken inside it, so parallel adds neither pass the
    // limit together nor share a position.
    await sendBackIfPublished(deckId);
    try {
      const card = await prisma.$transaction(
        async (tx) => {
          await lockUser(tx, userId);
          if ((await tx.word.count({ where: mine })) >= DECK_LIMITS.cardsPerDeck) throw new LimitReached();
          const last = await tx.word.findFirst({ where: mine, orderBy: { serial: "desc" }, select: { serial: true } });
          return tx.word.create({
            data: { ...wordData({ ...a, ...extras }), code: newCardCode(), serial: (last?.serial ?? 0) + 1, kind: "WORD", deckId, ownerId: userId },
            select: { id: true },
          });
        },
        { maxWait: 10_000, timeout: 20_000 },
      );
      return NextResponse.json({ ok: true, id: card.id });
    } catch (e) {
      if (e instanceof LimitReached) return fail(`A deck holds up to ${DECK_LIMITS.cardsPerDeck} cards. Start a new deck for more.`, 400);
      throw e;
    }
  }

  await sendBackIfPublished(deckId);
  await prisma.word.updateMany({ where: { id: a.cardId, ...mine }, data: wordData({ ...a, ...extras }) });
  // Files the card no longer points at are removed after the row is saved.
  const dropped = [
    current!.imageUrl && current!.imageUrl !== a.imageKey ? current!.imageUrl : null,
    current!.audioUrl && current!.audioUrl !== a.audioKey ? current!.audioUrl : null,
  ].filter((k): k is string => Boolean(k));
  await removeObjects(dropped);
  return NextResponse.json({ ok: true });
}
