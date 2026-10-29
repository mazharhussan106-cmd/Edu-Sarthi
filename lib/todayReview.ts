// Owns the numbers behind "Today's review": for each built-in kind of card
// (words, chunks, grammar, support) how many are due and how many new ones
// are left today, and which of the student's decks have cards due.
//
// The Flashcard tab shows these counts only for the tab that is open, so a
// student on Words never learns that ten Chunk cards are waiting. This puts
// every kind on one page. The rules are the tab's own (lib/flashcards): due =
// answered at least once and dueAt passed; the new-card limit counts each
// kind separately, by India day.
//
// Two grouped SQL reads instead of a count per kind and per deck: the live
// pool has one connection, so eight small counts would queue one behind the
// other on every visit.

import { Prisma, type CardKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { istDayStart } from "@/lib/aiLimits";
import { studyDecks } from "@/lib/myCards";

export type KindToday = { due: number; newLeft: number; newToday: number };
export type DeckToday = { id: string; title: string; href: string; due: number };

export async function todayReview(userId: string, newPerDay: number) {
  const now = new Date();
  const [byKind, byDeck, totals, decks] = await Promise.all([
    prisma.$queryRaw<{ kind: CardKind; due: number; newToday: number; seen: number }[]>(Prisma.sql`
      SELECT w."kind"::text AS kind,
             COUNT(*) FILTER (WHERE cs."dueAt" <= ${now})::int AS due,
             COUNT(*) FILTER (WHERE cs."createdAt" >= ${istDayStart(now)})::int AS "newToday",
             COUNT(*)::int AS seen
      FROM "CardState" cs JOIN "Word" w ON w."id" = cs."wordId"
      WHERE cs."userId" = ${userId} AND cs."reviews" > 0 AND w."deckId" IS NULL
      GROUP BY w."kind"`),
    prisma.$queryRaw<{ deckId: string; due: number }[]>(Prisma.sql`
      SELECT w."deckId" AS "deckId", COUNT(*)::int AS due
      FROM "CardState" cs JOIN "Word" w ON w."id" = cs."wordId"
      WHERE cs."userId" = ${userId} AND cs."reviews" > 0 AND cs."dueAt" <= ${now} AND w."deckId" IS NOT NULL
      GROUP BY w."deckId"`),
    prisma.word.groupBy({ by: ["kind"], where: { deckId: null }, _count: true }),
    studyDecks(userId),
  ]);

  const kinds = new Map<CardKind, KindToday>();
  for (const t of totals) {
    const row = byKind.find((r) => r.kind === t.kind);
    // Capped by what is left to learn, so a finished kind never claims
    // "10 new" that the tab would not actually serve.
    const unseen = Math.max(0, t._count - (row?.seen ?? 0));
    kinds.set(t.kind, {
      due: row?.due ?? 0,
      newLeft: Math.min(unseen, Math.max(0, newPerDay - (row?.newToday ?? 0))),
      // The dashboard ticks "learn new words" off once today's limit is used.
      newToday: row?.newToday ?? 0,
    });
  }

  // Only decks the student can still open; a lost deck's due cards would be a
  // link to a 404.
  const deckRows: DeckToday[] = byDeck
    .filter((r) => decks.has(r.deckId))
    .map((r) => ({ id: r.deckId, due: r.due, ...decks.get(r.deckId)! }))
    .sort((a, b) => b.due - a.due);

  return { kinds, decks: deckRows };
}
