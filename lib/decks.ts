// Owns reading and writing a student's decks: ownership checks, the card
// <-> Word mapping, picking the next card to study, and copying a shared deck.
//
// Every function takes the current user's id and puts it in the WHERE clause.
// A deck or card the user does not own simply does not exist as far as this
// file is concerned — never fetched and compared afterwards.
//
// It deliberately does NOT validate input (lib/deckSchemas) or talk HTTP (the
// routes). Storage is touched only to copy or delete the files behind cards.

import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { copyObject, removeObjects } from "@/lib/storage";
import { DECK_LIMITS } from "@/lib/deckSchemas";

export type CardFields = {
  front: string;
  back: string;
  example: string;
  body: string;
  imageKey: string | null;
  audioKey: string | null;
};

/// Student-made cards carry a "U-" code so they can never collide with the
/// sheet's own IDs (e.g. VRB-006), which are unique across all of Word.
export function newCardCode(): string {
  return `U-${randomBytes(6).toString("hex").toUpperCase()}`;
}

/// Unguessable: 96 random bits. Possession of the token IS the permission.
export function newShareToken(): string {
  return randomBytes(12).toString("base64url");
}

export function wordData(c: CardFields) {
  return {
    text: c.front,
    details: { meaning: c.back, example: c.example, body: c.body } satisfies Prisma.InputJsonObject,
    imageUrl: c.imageKey,
    audioUrl: c.audioKey,
  };
}

export const CARD_SELECT = {
  id: true,
  code: true,
  serial: true,
  text: true,
  details: true,
  imageUrl: true,
  audioUrl: true,
} satisfies Prisma.WordSelect;

export type StoredCard = Prisma.WordGetPayload<{ select: typeof CARD_SELECT }>;

/// A card's text fields, read defensively: `details` is Json and may be empty.
export function cardText(card: Pick<StoredCard, "details">) {
  const d = card.details && typeof card.details === "object" ? (card.details as Record<string, unknown>) : {};
  const str = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  return { back: str("meaning"), example: str("example"), body: str("body") };
}

export async function ownDeck(userId: string, id: string) {
  return prisma.deck.findFirst({ where: { id, ownerId: userId } });
}

/// Rows the student may mark, remark or note: the built-in cards and their own.
/// Cards in someone else's deck — even one shared by link — are view-only.
export async function canStudyWord(userId: string, wordId: string): Promise<boolean> {
  const w = await prisma.word.findFirst({
    where: { id: wordId, OR: [{ deckId: null }, { ownerId: userId }] },
    select: { id: true },
  });
  return w !== null;
}

export async function deckStudyCounts(userId: string, deckId: string) {
  const now = new Date();
  const [total, due, started] = await Promise.all([
    prisma.word.count({ where: { deckId, ownerId: userId } }),
    prisma.cardState.count({ where: { userId, dueAt: { lte: now }, word: { deckId, ownerId: userId } } }),
    prisma.cardState.count({ where: { userId, word: { deckId, ownerId: userId } } }),
  ]);
  return { total, due, fresh: Math.max(0, total - started) };
}

/// Due cards first (oldest due first), then cards never seen, in deck order.
/// Own decks have no daily new-card limit: the student chose every card.
export async function nextDeckCardId(userId: string, deckId: string): Promise<string | null> {
  const mine = { deckId, ownerId: userId };
  const due = await prisma.cardState.findFirst({
    where: { userId, dueAt: { lte: new Date() }, word: mine },
    orderBy: { dueAt: "asc" },
    select: { wordId: true },
  });
  if (due) return due.wordId;
  const fresh = await prisma.word.findFirst({
    where: { ...mine, states: { none: { userId } } },
    orderBy: { serial: "asc" },
    select: { id: true },
  });
  return fresh?.id ?? null;
}

/// Files behind a set of cards, for cleanup after a delete.
export function mediaKeys(cards: { imageUrl: string | null; audioUrl: string | null }[]): string[] {
  return cards.flatMap((c) => [c.imageUrl, c.audioUrl]).filter((k): k is string => Boolean(k));
}

export async function deleteDeck(userId: string, id: string): Promise<boolean> {
  const cards = await prisma.word.findMany({ where: { deckId: id, ownerId: userId }, select: { imageUrl: true, audioUrl: true } });
  // Scoped delete: count 0 means it was not this user's deck.
  const res = await prisma.deck.deleteMany({ where: { id, ownerId: userId } });
  if (res.count === 0) return false;
  // Rows first, files second: a failed file delete leaves an unreachable
  // orphan, whereas the other order could leave cards whose pictures vanished.
  await removeObjects(mediaKeys(cards));
  return true;
}

/// Copies a deck the caller may read (by link or from the library) into the user's own account as a private deck.
/// Files are copied before the transaction — they are slow and not atomic —
/// so the transaction only holds the cheap row inserts.
export async function copyDeck(userId: string, where: Prisma.DeckWhereInput): Promise<{ id: string } | { error: string }> {
  const source = await prisma.deck.findFirst({
    where,
    select: { id: true, title: true, description: true, tags: true, cards: { orderBy: { serial: "asc" }, select: CARD_SELECT } },
  });
  if (!source) return { error: "This deck is no longer available. Go back and pick another." };
  if ((await prisma.deck.count({ where: { ownerId: userId } })) >= DECK_LIMITS.decksPerUser) {
    return { error: `You have ${DECK_LIMITS.decksPerUser} decks already. Delete one you no longer need, then copy again.` };
  }

  const cards = await Promise.all(
    source.cards.map(async (c) => ({
      c,
      imageKey: c.imageUrl ? await copyObject(c.imageUrl, userId) : null,
      audioKey: c.audioUrl ? await copyObject(c.audioUrl, userId) : null,
    })),
  );

  const deck = await prisma.$transaction(
    async (tx) => {
      const created = await tx.deck.create({
        data: { ownerId: userId, title: source.title.slice(0, 70) + " (copy)", description: source.description, tags: source.tags },
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
          details: (c.details ?? {}) as Prisma.InputJsonObject,
          imageUrl: imageKey,
          audioUrl: audioKey,
        })),
      });
      return created;
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
  return deck;
}

/// Reads a JSON body without throwing: a malformed or empty body is the
/// caller's 400, not a 500.
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
