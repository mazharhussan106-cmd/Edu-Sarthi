// Owns writes on the cards inside a deck: add, edit, delete — by its owner or
// an editor it is shared with (lib/deckAccess). A card is a Word row with the
// deck set and, whoever added it, the deck's owner as its owner.
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
// On a published deck only small fixes are allowed here (lib/smallFix): they
// go live at once and the admin checks them afterwards. Adding, deleting and
// bigger edits happen in a new version (lib/deckVersion).
//
// It deliberately does NOT issue upload URLs or decide the deck's sharing.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { cardText, isStaff, LimitReached, lockUser, newCardCode, readJson, unusedKeys, wordData } from "@/lib/decks";
import { deckAccess, editBlock } from "@/lib/deckAccess";
import { isLive } from "@/lib/deckVersion";
import { applySmallFix, bigReason, fixText } from "@/lib/smallFix";
import { DECK_LIMITS, cardActionSchema } from "@/lib/deckSchemas";
import { objectExists, removeObjects, isOwnKey } from "@/lib/storage";
import { parseVideoUrl } from "@/lib/video";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
const NEW_VERSION = "Start a new version for bigger changes; the current version stays live while it is reviewed.";

async function badKey(userId: string, key: string | null, current: string | null): Promise<boolean> {
  if (!key || key === current) return false; // unchanged or cleared
  return !isOwnKey(userId, key) || !(await objectExists(key));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;
  const { id: deckId } = await params;

  const parsed = cardActionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Could not save that card. Check the fields and try again.", 400);
  const a = parsed.data;

  const access = await deckAccess(userId, deckId);
  if (!access) return fail("That deck no longer exists.", 404);
  const blocked = editBlock(access);
  if (blocked) return fail(blocked, 403);
  const deck = access.deck;
  const live = isLive(deck);
  // Cards stay the deck owner's whoever adds them: every owner-scoped query
  // keeps working, and an editor deleting their account never takes a card's
  // files with them.
  const mine = { deckId, ownerId: deck.ownerId };
  if (live && a.action !== "edit") return fail(`This deck is published, so cards are added or removed in a new version. ${NEW_VERSION}`, 400);

  if (a.action === "delete") {
    const card = await prisma.word.findFirst({ where: { id: a.cardId, ...mine }, select: { imageUrl: true, audioUrl: true } });
    if (!card) return fail("That card no longer exists.", 404);
    await prisma.word.deleteMany({ where: { id: a.cardId, ...mine } });
    // A new version shares files with its live deck; keep any still in use.
    await removeObjects(await unusedKeys([card.imageUrl, card.audioUrl].filter((k): k is string => Boolean(k))));
    return NextResponse.json({ ok: true });
  }

  const current = a.action === "edit" ? await prisma.word.findFirst({ where: { id: a.cardId, ...mine }, select: { text: true, imageUrl: true, audioUrl: true, videoUrl: true, details: true, updatedAt: true } }) : null;
  if (a.action === "edit" && !current) return fail("That card no longer exists.", 404);
  // Two editors on one card: the later save must not silently erase the other.
  if (a.action === "edit" && a.openedAt && current!.updatedAt.getTime() > Date.parse(a.openedAt)) {
    return fail("Someone changed this card after you opened it. Reload the page to see their version, then make your change again.", 409);
  }
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

  if (live && current && a.action === "edit") {
    // Paused while a new version is in progress: approving that version would
    // otherwise quietly overwrite a fix made after it was started.
    if (await prisma.deck.count({ where: { draftOfId: deckId } })) {
      return fail("You have a new version of this deck in progress. Make the fix there; it goes live when the version is approved.", 400);
    }
    const changesMedia =
      a.imageKey !== current.imageUrl || a.audioKey !== current.audioUrl || (extras.videoUrl || null) !== (current.videoUrl ?? null) || extras.audit !== kept.audit;
    const before = fixText(current);
    const after = { front: a.front, back: a.back, example: a.example, body: a.body };
    const reason = bigReason(changesMedia, before, after);
    if (reason) return fail(`${reason} A small fix changes up to ${DECK_LIMITS.smallFixChars} characters per field. ${NEW_VERSION}`, 400);
    const res = await applySmallFix(userId, deckId, a.cardId, before, after);
    return "error" in res ? fail(res.error, 400) : NextResponse.json({ ok: true, smallFix: true });
  }

  if (a.action === "add") {
    // Limit check and insert under one per-deck lock (see lockUser), and the
    // new card's number taken inside it, so parallel adds — by the owner and
    // editors — neither pass the limit together nor share a position.
    try {
      const card = await prisma.$transaction(
        async (tx) => {
          await lockUser(tx, deckId);
          if ((await tx.word.count({ where: mine })) >= DECK_LIMITS.cardsPerDeck) throw new LimitReached();
          const last = await tx.word.findFirst({ where: mine, orderBy: { serial: "desc" }, select: { serial: true } });
          return tx.word.create({
            data: { ...wordData({ ...a, ...extras }), code: newCardCode(), serial: (last?.serial ?? 0) + 1, kind: "WORD", deckId, ownerId: deck.ownerId },
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

  // Editing a card must not drop the AI-assisted label; it is read from what is
  // stored, never from the request, so it cannot be added or removed here.
  await prisma.word.updateMany({ where: { id: a.cardId, ...mine }, data: wordData({ ...a, ...extras, aiAssisted: current ? cardText(current).aiAssisted : false }) });
  // Files the card no longer points at are removed after the row is saved.
  const dropped = [
    current!.imageUrl && current!.imageUrl !== a.imageKey ? current!.imageUrl : null,
    current!.audioUrl && current!.audioUrl !== a.audioKey ? current!.audioUrl : null,
  ].filter((k): k is string => Boolean(k));
  await removeObjects(await unusedKeys(dropped));
  return NextResponse.json({ ok: true });
}
