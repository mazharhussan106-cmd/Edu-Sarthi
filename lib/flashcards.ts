// Owns choosing which flashcard a student sees next, and the counts around it.
//
// Order: cards whose review is due (oldest due first), then new cards in the
// sheet's order, up to NEW_PER_DAY a day. When both run out the session is
// done for today; "keep going" lifts the new-card limit on request.
//
// Only built-in cards (deckId null) count here. Student-made cards are Word
// rows too, and without this filter one student's private card would show up
// in another student's daily session and inflate the totals.
//
// Days are counted in India time, as everywhere else in the app.
//
// `skip` is the list of cards the student passed over with › this session.
// It lives in the URL, not the database: skipping is "not now", not an
// answer, so it must never move a card's review date.

import type { CardKind, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { NEW_PER_DAY } from "@/lib/srs";

const IST = 5.5 * 3_600_000;

function startOfTodayIst(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST);
}

export const WORD_SELECT = {
  id: true,
  code: true,
  text: true,
  details: true,
  partOfSpeech: true,
  category: true,
  cefr: true,
  importance: true,
  imageUrl: true,
  audioUrl: true,
  videoUrl: true,
} satisfies Prisma.WordSelect;

export async function deckCounts(userId: string, kind: CardKind) {
  const now = new Date();
  const [due, newToday, known, total, tagged] = await Promise.all([
    prisma.cardState.count({ where: { userId, dueAt: { lte: now }, word: { kind, deckId: null } } }),
    prisma.cardState.count({ where: { userId, createdAt: { gte: startOfTodayIst(now) }, word: { kind, deckId: null } } }),
    prisma.cardState.count({ where: { userId, known: true, word: { kind, deckId: null } } }),
    prisma.word.count({ where: { kind, deckId: null } }),
    prisma.cardState.groupBy({
      by: ["important", "favourite", "doubt", "confident"],
      where: { userId, word: { kind, deckId: null } },
      _count: true,
    }),
  ]);
  const sum = (k: "important" | "favourite" | "doubt" | "confident") =>
    tagged.filter((t) => t[k]).reduce((n, t) => n + t._count, 0);
  return {
    due,
    newLeft: Math.max(0, NEW_PER_DAY - newToday),
    known,
    total,
    lists: { important: sum("important"), favourite: sum("favourite"), doubt: sum("doubt"), confident: sum("confident") },
  };
}

export async function nextCardId(
  userId: string,
  kind: CardKind,
  extra: boolean,
  skip: string[] = [],
): Promise<string | null> {
  const now = new Date();
  const notSkipped = skip.length ? { code: { notIn: skip } } : {};
  const due = await prisma.cardState.findFirst({
    where: { userId, dueAt: { lte: now }, word: { kind, deckId: null, ...notSkipped } },
    orderBy: { dueAt: "asc" },
    select: { wordId: true },
  });
  if (due) return due.wordId;

  if (!extra) {
    const newToday = await prisma.cardState.count({
      where: { userId, createdAt: { gte: startOfTodayIst(now) }, word: { kind, deckId: null } },
    });
    if (newToday >= NEW_PER_DAY) return null;
  }

  const fresh = await prisma.word.findFirst({
    where: { kind, deckId: null, states: { none: { userId } }, ...notSkipped },
    orderBy: { serial: "asc" },
    select: { id: true },
  });
  return fresh?.id ?? null;
}
