// Owns reading and writing a student's decks: ownership checks, the card
// <-> Word mapping, and picking the next card to study — in their own decks
// and in library decks they follow. Copying lives in lib/deckCopy, following
// in lib/deckFollow.
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
import { removeObjects, resolveMediaUrl } from "@/lib/storage";
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
  /// Set only by the AI card route, and carried over when a card is edited, so
  /// the "AI-assisted" label cannot be lost by fixing a typo.
  aiAssisted?: boolean;
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

/// A deck anyone may find and read (a signed-in person may also follow and
/// study it; a visitor with no account only reads it): approved for the
/// library, its owner not suspended, and — for a deck published as an
/// institute — the institute not suspended (owner's decision: hidden until it
/// is reinstated). Leaving this state (withdrawn, taken down, back in review)
/// stops followers studying it at once.
export const LISTED = {
  visibility: "PUBLIC",
  status: "APPROVED",
  owner: { suspendedAt: null },
  // isNot also matches decks with no institute at all (checked against the SQL).
  institute: { isNot: { status: "SUSPENDED" } },
} satisfies Prisma.DeckWhereInput;

export function wordData(c: CardFields) {
  return {
    text: c.front,
    details: { meaning: c.back, example: c.example, body: c.body, audit: c.audit, ...(c.aiAssisted ? { aiAssisted: true } : {}) } satisfies Prisma.InputJsonObject,
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
  return { back: str("meaning"), example: str("example"), body: str("body"), audit: str("audit"), rich, aiAssisted: d.aiAssisted === true };
}

/// The filter for cards the AI helped make, in one place so the editor, the
/// library and admin review all mean the same thing by "AI-assisted".
export const AI_CARD_FILTER = { details: { path: ["aiAssisted"], equals: true } } satisfies Prisma.WordWhereInput;

/// How many AI-assisted cards each of these decks holds (decks with none are
/// absent from the map). One query for a whole page of decks.
export async function aiCardCounts(deckIds: string[]): Promise<Map<string, number>> {
  if (!deckIds.length) return new Map();
  const rows = await prisma.word.groupBy({ by: ["deckId"], where: { deckId: { in: deckIds }, ...AI_CARD_FILTER }, _count: { _all: true } });
  return new Map(rows.flatMap((r) => (r.deckId ? [[r.deckId, r._count._all] as [string, number]] : [])));
}

export async function ownDeck(userId: string, id: string) {
  return prisma.deck.findFirst({ where: { id, ownerId: userId } });
}

/// Rows the student may mark, remark or note: the built-in cards, their own,
/// cards of decks shared with them by name, and of library decks they follow. Cards in a deck shared by link, or a
/// followed deck that has left the library, are view-only.
export async function canStudyWord(userId: string, wordId: string): Promise<boolean> {
  const w = await prisma.word.findFirst({
    where: {
      id: wordId,
      OR: [
        { deckId: null },
        { ownerId: userId },
        { deck: { ...LISTED, follows: { some: { userId } } } },
        // Shared by name, to view or edit: studied with the person's own progress.
        { deck: { draftOfId: null, members: { some: { userId, acceptedAt: { not: null } } } } },
      ],
    },
    select: { id: true },
  });
  return w !== null;
}

/// The cards a study session may pick from: the user's own cards in their own
/// deck, or every card of a deck they follow (the caller has checked the follow).
function studyCards(userId: string, deckId: string, followed: boolean): Prisma.WordWhereInput {
  return followed ? { deckId } : { deckId, ownerId: userId };
}

export async function deckStudyCounts(userId: string, deckId: string, followed = false) {
  const now = new Date();
  const cards = studyCards(userId, deckId, followed);
  const [total, due, started] = await Promise.all([
    prisma.word.count({ where: cards }),
    prisma.cardState.count({ where: { userId, reviews: { gt: 0 }, dueAt: { lte: now }, word: cards } }),
    prisma.cardState.count({ where: { userId, reviews: { gt: 0 }, word: cards } }),
  ]);
  return { total, due, fresh: Math.max(0, total - started) };
}

/// Due cards first (oldest due first), then cards never seen, in deck order.
/// Own and followed decks have no daily new-card limit: the student chose them.
export async function nextDeckCardId(userId: string, deckId: string, skip: string[] = [], followed = false): Promise<string | null> {
  // Skipped cards ("›") are "not now", kept in the URL, never a review answer.
  const mine = { ...studyCards(userId, deckId, followed), ...(skip.length ? { code: { notIn: skip } } : {}) };
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

/// Of these files, the ones no card points at any more. A deck's new version
/// shares pictures and audio with the live deck (lib/deckVersion), so a file is
/// deleted only once neither uses it. Call after the rows are gone.
export async function unusedKeys(keys: string[]): Promise<string[]> {
  if (!keys.length) return [];
  const used = await prisma.word.findMany({ where: { OR: [{ imageUrl: { in: keys } }, { audioUrl: { in: keys } }] }, select: { imageUrl: true, audioUrl: true } });
  const inUse = new Set(mediaKeys(used));
  return keys.filter((k) => !inUse.has(k));
}

export async function deleteDeck(userId: string, id: string): Promise<boolean> {
  const cards = await prisma.word.findMany({ where: { deckId: id, ownerId: userId }, select: { imageUrl: true, audioUrl: true } });
  // Scoped delete: count 0 means it was not this user's deck.
  const res = await prisma.deck.deleteMany({ where: { id, ownerId: userId } });
  if (res.count === 0) return false;
  // Rows first, files second: a failed file delete leaves an unreachable
  // orphan, whereas the other order could leave cards whose pictures vanished.
  await removeObjects(await unusedKeys(mediaKeys(cards)));
  return true;
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
            { deck: { ...LISTED, owner: { role: "TEACHER", teacherVerifiedAt: { not: null }, suspendedAt: null } } },
          ],
        },
      ],
    },
    select: { id: true, code: true, text: true, deckId: true, deck: { select: { ownerId: true } } },
  });
  return w ? { ...w, teacherId: w.deck?.ownerId ?? null } : null;
}
