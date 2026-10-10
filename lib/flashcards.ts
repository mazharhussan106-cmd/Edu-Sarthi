// Owns choosing which flashcard a student sees next, and the counts around it.
//
// Order: cards whose review is due (oldest due first), then new cards in the
// sheet's order, up to the student's daily limit (default NEW_PER_DAY). When both run out the session is
// done for today; "keep going" lifts the new-card limit on request.
//
// Only built-in cards (deckId null) count here. Student-made cards are Word
// rows too, and without this filter one student's private card would show up
// in another student's daily session and inflate the totals.
//
// Days are counted in India time, as everywhere else in the app.
//
// A Deck is one kind of card (words, chunks, grammar), optionally narrowed to
// one chunk type. Every kind has one learning order, `serial`. The daily
// new-card limit counts the whole kind, so filtering to one type does not
// hand out another ten new cards.
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
  kind: true,
  serial: true,
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

export type Deck = { kind: CardKind; category?: string };

// Must match the exercise titles created by prisma/import-words.ts and
// prisma/import-chunks.ts (which also loads grammar). "Record yourself" attaches the recording to these.
export const PRACTICE_TITLE: Record<CardKind, string> = {
  WORD: "Use the word in your own sentences",
  CHUNK: "Use the chunk in your own sentences",
  GRAMMAR: "Use the grammar frame in your own sentences",
};

function wordWhere(deck: Deck) {
  // deckId null: only built-in cards. Student-made and imported deck cards are
  // Word rows too, and must never leak into the shared daily session.
  return { kind: deck.kind, deckId: null, ...(deck.category ? { category: deck.category } : {}) };
}

export async function deckCounts(userId: string, deck: Deck, newPerDay = NEW_PER_DAY) {
  const { kind } = deck;
  const word = wordWhere(deck);
  const now = new Date();
  const [due, newToday, known, total, tagged] = await Promise.all([
    prisma.cardState.count({ where: { userId, reviews: { gt: 0 }, dueAt: { lte: now }, word } }),
    prisma.cardState.count({ where: { userId, reviews: { gt: 0 }, createdAt: { gte: startOfTodayIst(now) }, word: { kind, deckId: null } } }),
    prisma.cardState.count({ where: { userId, known: true, word } }),
    prisma.word.count({ where: word }),
    prisma.cardState.groupBy({
      by: ["important", "favourite", "doubt", "confident"],
      where: { userId, word },
      _count: true,
    }),
  ]);
  const sum = (k: "important" | "favourite" | "doubt" | "confident") =>
    tagged.filter((t) => t[k]).reduce((n, t) => n + t._count, 0);
  return {
    due,
    newLeft: Math.max(0, newPerDay - newToday),
    known,
    total,
    lists: { important: sum("important"), favourite: sum("favourite"), doubt: sum("doubt"), confident: sum("confident") },
  };
}

export async function nextCardId(
  userId: string,
  deck: Deck,
  extra: boolean,
  skip: string[] = [],
  newPerDay = NEW_PER_DAY,
): Promise<string | null> {
  const now = new Date();
  const notSkipped = skip.length ? { code: { notIn: skip } } : {};
  const due = await prisma.cardState.findFirst({
    where: { userId, reviews: { gt: 0 }, dueAt: { lte: now }, word: { ...wordWhere(deck), ...notSkipped } },
    orderBy: { dueAt: "asc" },
    select: { wordId: true },
  });
  if (due) return due.wordId;

  if (!extra) {
    const newToday = await prisma.cardState.count({
      where: { userId, reviews: { gt: 0 }, createdAt: { gte: startOfTodayIst(now) }, word: { kind: deck.kind, deckId: null } },
    });
    if (newToday >= newPerDay) return null;
  }

  const fresh = await prisma.word.findFirst({
    // Not yet answered: a card the student only tagged or noted is still new.
    where: { ...wordWhere(deck), NOT: { states: { some: { userId, reviews: { gt: 0 } } } }, ...notSkipped },
    orderBy: { serial: "asc" },
    select: { id: true },
  });
  return fresh?.id ?? null;
}

/// What a chunk or grammar card needs beyond its own row: three other chunks for the
/// multiple choice (from the same group, so the choice is a real one, and
/// the nearest in learning order, so they stay the same on every visit),
/// and the text of the related chunk the sheet points to.
export async function chunkExtras(word: { id: string; kind: CardKind; serial: number; category: string | null; details: unknown }) {
  const d = (word.details ?? {}) as { group?: string | null; related?: string | null };
  const near = (rows: { text: string; serial: number }[]) =>
    rows.sort((a, b) => Math.abs(a.serial - word.serial) - Math.abs(b.serial - word.serial)).map((r) => r.text);

  const sameGroup = d.group
    ? await prisma.word.findMany({
        where: { kind: word.kind, id: { not: word.id }, details: { path: ["group"], equals: d.group } },
        select: { text: true, serial: true },
        // Ordered, or "which 40" is arbitrary and the choices change between visits.
        orderBy: { serial: "asc" },
        take: 40,
      })
    : [];
  let distractors = near(sameGroup).slice(0, 3);
  if (distractors.length < 3 && word.category) {
    const sameType = await prisma.word.findMany({
      where: { kind: word.kind, id: { not: word.id }, category: word.category, text: { notIn: distractors } },
      select: { text: true, serial: true },
      orderBy: { serial: "asc" },
      take: 40,
    });
    distractors = [...distractors, ...near(sameType)].slice(0, 3);
  }

  const related = d.related
    ? await prisma.word.findUnique({ where: { code: d.related }, select: { code: true, text: true } })
    : null;
  return { distractors, related };
}
