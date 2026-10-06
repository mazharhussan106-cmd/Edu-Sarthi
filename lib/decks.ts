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
import { copyObject, removeObjects, resolveMediaUrl } from "@/lib/storage";
import { DECK_LIMITS } from "@/lib/deckSchemas";

export type CardFields = {
  front: string;
  back: string;
  example: string;
  body: string;
  imageKey: string | null;
  audioKey: string | null;
  /// Embed address from lib/video, or "".
  videoUrl: string;
  /// Teacher's guide: what to listen for. "" for student cards.
  audit: string;
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

/// Serialises one user's "check the limit, then create" steps. Without it, 50
/// parallel requests all read "19 decks" and all create one, so the limit only
/// holds against a person clicking, not against a script. A transaction-scoped
/// advisory lock on the user's id queues them one after another; it is released
/// when the transaction ends and blocks no one else.
export async function lockUser(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
}

export class LimitReached extends Error {}

export function wordData(c: CardFields) {
  return {
    text: c.front,
    details: { meaning: c.back, example: c.example, body: c.body, audit: c.audit } satisfies Prisma.InputJsonObject,
    imageUrl: c.imageKey,
    audioUrl: c.audioKey,
    videoUrl: c.videoUrl || null,
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
  videoUrl: true,
} satisfies Prisma.WordSelect;

export type StoredCard = Prisma.WordGetPayload<{ select: typeof CARD_SELECT }>;

/// A card's text fields, read defensively: `details` is Json and may be empty.
export function cardText(card: Pick<StoredCard, "details">) {
  const d = card.details && typeof card.details === "object" ? (card.details as Record<string, unknown>) : {};
  const str = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  // A card from an Excel import carries every field here; hand-made cards do not.
  const r = d.rich && typeof d.rich === "object" ? (d.rich as Record<string, unknown>) : null;
  const rich = r ? Object.fromEntries(Object.entries(r).filter(([, v]) => typeof v === "string")) as Record<string, string> : null;
  return { back: str("meaning"), example: str("example"), body: str("body"), audit: str("audit"), rich };
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
    prisma.cardState.count({ where: { userId, reviews: { gt: 0 }, dueAt: { lte: now }, word: { deckId, ownerId: userId } } }),
    prisma.cardState.count({ where: { userId, reviews: { gt: 0 }, word: { deckId, ownerId: userId } } }),
  ]);
  return { total, due, fresh: Math.max(0, total - started) };
}

/// Due cards first (oldest due first), then cards never seen, in deck order.
/// Own decks have no daily new-card limit: the student chose every card.
export async function nextDeckCardId(userId: string, deckId: string, skip: string[] = []): Promise<string | null> {
  // Skipped cards ("›") are "not now", kept in the URL, never a review answer.
  const mine = { deckId, ownerId: userId, ...(skip.length ? { code: { notIn: skip } } : {}) };
  const due = await prisma.cardState.findFirst({
    where: { userId, reviews: { gt: 0 }, dueAt: { lte: new Date() }, word: mine },
    orderBy: { dueAt: "asc" },
    select: { wordId: true },
  });
  if (due) return due.wordId;
  const fresh = await prisma.word.findFirst({
    where: { ...mine, NOT: { states: { some: { userId, reviews: { gt: 0 } } } } },
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
    select: { id: true, title: true, description: true, tags: true, cards: { orderBy: { serial: "asc" }, select: { ...CARD_SELECT, category: true } } },
  });
  if (!source) return { error: "This deck is no longer available. Go back and pick another." };
  if ((await prisma.deck.count({ where: { ownerId: userId } })) >= DECK_LIMITS.decksPerUser) {
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
        if ((await tx.deck.count({ where: { ownerId: userId } })) >= DECK_LIMITS.decksPerUser) throw new LimitReached();
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

/// Reads a JSON body without throwing: a malformed or empty body is the
/// caller's 400, not a 500.
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/// Staff accounts and institute teachers may use the teacher-only card sections (video, teacher's
/// guide). Read from the database, not the JWT: a demotion applies at once.
export async function isStaff(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, suspendedAt: true, instituteMembership: { select: { role: true, institute: { select: { status: true } } } } },
  });
  if (!u || u.suspendedAt) return false;
  // An approved institute's teachers and admin count too, whatever their
  // account role: the institute vouches for them inside its own walls.
  const m = u.instituteMembership;
  const instituteStaff = !!m && m.institute.status === "APPROVED" && m.role !== "STUDENT";
  return u.role === "TEACHER" || u.role === "ADMIN" || instituteStaff;
}

/// A stored card as the card faces show it: media keys resolved to signed URLs.
export async function faceCard(c: StoredCard) {
  return {
    id: c.id,
    code: c.code,
    front: c.text,
    ...cardText(c),
    videoSrc: c.videoUrl,
    imageSrc: c.imageUrl ? await resolveMediaUrl(c.imageUrl) : null,
    audioSrc: c.audioUrl ? await resolveMediaUrl(c.audioUrl) : null,
  };
}

/// Cards a learner may record themselves saying: the built-in words, and cards
/// in a published deck whose owner is a verified, active teacher — the one who
/// will audit the recording. Returns the card and that teacher's id (null for
/// built-in words, which go to the general queue).
export async function practiceWord(where: Prisma.WordWhereInput) {
  const w = await prisma.word.findFirst({
    where: {
      AND: [
        where,
        {
          OR: [
            { deckId: null },
            { deck: { visibility: "PUBLIC", status: "APPROVED", owner: { role: "TEACHER", teacherVerifiedAt: { not: null }, suspendedAt: null } } },
          ],
        },
      ],
    },
    select: { id: true, code: true, text: true, deckId: true, deck: { select: { ownerId: true } } },
  });
  return w ? { ...w, teacherId: w.deck?.ownerId ?? null } : null;
}
