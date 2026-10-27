// Owns copying a deck the caller may read (by link, from the library, or from
// their institute) into their own account as a private deck — cards, pictures
// and audio — and recording where it came from: "Copied from <title> by
// <name>", which CC BY-SA requires and which survives the original's deletion.
//
// It deliberately does NOT decide who may copy what: the caller passes a WHERE
// that already limits the source (share token, approved library deck, or the
// institute's scope). Moved out of lib/decks to keep both files readable.

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { copyObject, removeObjects } from "@/lib/storage";
import { DECK_LIMITS } from "@/lib/deckSchemas";
import { CARD_SELECT, LimitReached, lockUser, newCardCode } from "@/lib/decks";
import { CREDIT_SELECT, LICENCES, creditName, sourceLine } from "@/lib/libraryTerms";

/// Copies a deck the caller may read (by link or from the library) into the user's own account as a private deck.
/// Files are copied before the transaction — they are slow and not atomic —
/// so the transaction only holds the cheap row inserts.
export async function copyDeck(userId: string, where: Prisma.DeckWhereInput): Promise<{ id: string } | { error: string }> {
  const source = await prisma.deck.findFirst({
    where,
    select: {
      id: true, title: true, description: true, tags: true, licence: true, sourceCredit: true, sourceLicence: true,
      owner: { select: CREDIT_SELECT },
      cards: { orderBy: { serial: "asc" }, select: { ...CARD_SELECT, category: true } },
    },
  });
  if (!source) return { error: "This deck is no longer available. Go back and pick another." };
  // EduSarthi's own material stays EduSarthi's however many copies deep: the
  // copy may be studied, never published or link-shared (lib/deckReview, the
  // share action).
  const edu = LICENCES.EDUSARTHI.id;
  const fromEduSarthi = source.owner.role === "ADMIN" || source.licence === edu || source.sourceLicence === edu;
  if ((await prisma.deck.count({ where: { ownerId: userId, draftOfId: null } })) >= DECK_LIMITS.decksPerUser) {
    return { error: `You have ${DECK_LIMITS.decksPerUser} decks already. Delete one you no longer need, then copy again.` };
  }

  // Files are copied a handful at a time, never hundreds at once: a 184-card
  // deck with pictures would otherwise open hundreds of storage requests in one go.
  const cards: { c: (typeof source.cards)[number]; imageKey: string | null; audioKey: string | null }[] = [];
  for (let i = 0; i < source.cards.length; i += 8) {
    cards.push(
      ...(await Promise.all(
        source.cards.slice(i, i + 8).map(async (c) => ({
          c,
          imageKey: c.imageUrl ? await copyObject(c.imageUrl, userId) : null,
          audioKey: c.audioUrl ? await copyObject(c.audioUrl, userId) : null,
        })),
      )),
    );
  }
  const copiedKeys = cards.flatMap((x) => [x.imageKey, x.audioKey]).filter((k): k is string => Boolean(k));

  let deck: { id: string };
  try {
    deck = await prisma.$transaction(
      async (tx) => {
        await lockUser(tx, userId);
        // The real check, under the lock; the one above only saves work.
        if ((await tx.deck.count({ where: { ownerId: userId, draftOfId: null } })) >= DECK_LIMITS.decksPerUser) throw new LimitReached();
        const created = await tx.deck.create({
          data: {
            ownerId: userId,
            title: source.title.slice(0, 70) + " (copy)",
            description: source.description,
            tags: source.tags,
            sourceDeckId: source.id,
            sourceCredit: sourceLine(source.title, creditName(source.owner), source.sourceCredit),
            sourceLicence: fromEduSarthi ? edu : source.licence,
          },
          select: { id: true },
        });
        await tx.word.createMany({
          data: cards.map(({ c, imageKey, audioKey }, i) => ({
            code: newCardCode(),
            serial: i + 1,
            kind: "WORD" as const,
            deckId: created.id,
            ownerId: userId,
            text: c.text,
            // Imported cards keep their topic, so the copy lists the same way.
            category: c.category,
            details: (c.details ?? {}) as Prisma.InputJsonObject,
            imageUrl: imageKey,
            audioUrl: audioKey,
            videoUrl: c.videoUrl,
          })),
        });
        return created;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
  } catch (e) {
    // Nothing points at the copied files now, so they would sit in storage for good.
    await removeObjects(copiedKeys);
    if (e instanceof LimitReached) return { error: `You have ${DECK_LIMITS.decksPerUser} decks already. Delete one you no longer need, then copy again.` };
    throw e;
  }
  // Counted only after the copy really exists, and outside the transaction:
  // a missed increment must not undo a copy.
  await prisma.deck.updateMany({ where: { id: source.id }, data: { copyCount: { increment: 1 } } });
  return deck;
}
