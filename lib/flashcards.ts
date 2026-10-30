// Owns choosing which flashcard a student sees next, and the counts around it.
//
// Order: cards whose review is due (oldest due first), then new cards in the
// sheet's order, up to the student's daily limit (default NEW_PER_DAY). When both run out the session is
// done for today; "keep going" lifts the new-card limit on request.
//
// Reviews have their own daily limit (the student's reviewsPerDay, 0 = none).
// Once it is used, due cards wait for tomorrow and new cards are still
// served; "keep going" lifts this limit too. A card's first answer makes it
// a new card that day; any later answer is a review (see answeredToday).
//
// Only built-in cards (deckId null) count here. Student-made cards are Word
// rows too, and without this filter one student's private card would show up
// in another student's daily session and inflate the totals.
//
// Days are counted in India time, as everywhere else in the app.
//
// A Deck is one kind of card (words, chunks, grammar, support), optionally
// narrowed to one chunk type, or to one support channel and level. Every kind has one learning order, `serial`. The daily
// new-card limit counts the whole kind, so filtering to one type does not
// hand out another ten new cards.
//
// `skip` is the list of cards the student passed over with › this session.
// It lives in the URL, not the database: skipping is "not now", not an
// answer, so it must never move a card's review date.

import type { CardKind, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { NEW_PER_DAY, istDayStart, servableDue } from "@/lib/srs";

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

/// `extra` narrows the built-in words to one section or pack (lib/wordSections);
/// `level` is the Support tab's level filter.
export type Deck = { kind: CardKind; category?: string; level?: string; extra?: Prisma.WordWhereInput };

// Must match the exercise titles created by prisma/import-words.ts and
// prisma/import-chunks.ts (which also loads grammar) and prisma/import-support.ts.
// "Record yourself" attaches the recording to these.
export const PRACTICE_TITLE: Record<CardKind, string> = {
  WORD: "Use the word in your own sentences",
  CHUNK: "Use the chunk in your own sentences",
  GRAMMAR: "Use the grammar frame in your own sentences",
  SUPPORT: "Say the support line for audit",
};

// Email cards cannot be said: the student writes the email and sends a photo,
// so they go to a separate exercise that expects an image.
export const SUPPORT_EMAIL_TITLE = "Write the support email for audit";

export function practiceTitle(word: { kind: CardKind; category: string | null }): string {
  return word.kind === "SUPPORT" && word.category === "email" ? SUPPORT_EMAIL_TITLE : PRACTICE_TITLE[word.kind];
}

function wordWhere(deck: Deck) {
  // deckId null: only built-in cards. Student-made and imported deck cards are
  // Word rows too, and must never leak into the shared daily session.
  // The support level lives in partOfSpeech, as the sheet writes it ("Basic").
  return {
    kind: deck.kind,
    deckId: null,
    ...(deck.category ? { category: deck.category } : {}),
    ...(deck.level ? { partOfSpeech: deck.level } : {}),
    // AND, so a section filter that uses OR cannot collide with other keys.
    ...(deck.extra ? { AND: [deck.extra] } : {}),
  };
}

/// Built-in cards of this session by code, for practice looks (lib/cardAgain):
/// only cards in the same tab, type, section or pack, in one query however
/// many codes wait, with the fields the card needs so the page does not
/// fetch the card a second time.
export async function findInDeck(deck: Deck, codes: string[]) {
  const rows = await prisma.word.findMany({ where: { ...wordWhere(deck), code: { in: codes } }, select: WORD_SELECT });
  return new Map(rows.map((r) => [r.code, r]));
}

/// Cards answered today in one kind: first answers (new cards) or later ones
/// (reviews), told apart by firstReviewedAt, which the first answer sets once.
/// Not createdAt (a remark or note makes the row too) and not the answer
/// count (opening a new card again with ‹ and answering it is still one new
/// card). A null firstReviewedAt is a card first answered before that column
/// existed, so it is old. Counted per kind, so a limit on the Words tab does
/// not use up the Chunk tab.
function answeredToday(userId: string, kind: CardKind, now: Date, first: boolean) {
  const today = istDayStart(now);
  return prisma.cardState.count({
    where: {
      userId,
      lastReviewedAt: { gte: today },
      ...(first ? { firstReviewedAt: { gte: today } } : { OR: [{ firstReviewedAt: { lt: today } }, { firstReviewedAt: null }] }),
      word: { kind, deckId: null },
    },
  });
}

/// How many more reviews today may serve; null when there is no limit.
async function reviewsLeft(userId: string, kind: CardKind, reviewsPerDay: number, now: Date): Promise<number | null> {
  if (reviewsPerDay <= 0) return null;
  return servableDue(Infinity, await answeredToday(userId, kind, now, false), reviewsPerDay);
}

export async function deckCounts(userId: string, deck: Deck, newPerDay = NEW_PER_DAY, reviewsPerDay = 0) {
  const { kind } = deck;
  const word = wordWhere(deck);
  const now = new Date();
  const [dueAll, newToday, known, total, tagged, left] = await Promise.all([
    prisma.cardState.count({ where: { userId, reviews: { gt: 0 }, dueAt: { lte: now }, word } }),
    answeredToday(userId, kind, now, true),
    prisma.cardState.count({ where: { userId, known: true, word } }),
    prisma.word.count({ where: word }),
    prisma.cardState.groupBy({
      by: ["important", "favourite", "doubt", "confident"],
      where: { userId, word },
      _count: true,
    }),
    reviewsLeft(userId, kind, reviewsPerDay, now),
  ]);
  const sum = (k: "important" | "favourite" | "doubt" | "confident") =>
    tagged.filter((t) => t[k]).reduce((n, t) => n + t._count, 0);
  // What today will actually serve: the cards past the limit wait.
  const due = left === null ? dueAll : Math.min(dueAll, left);
  const newLeft = Math.max(0, newPerDay - newToday);
  return {
    due,
    // Due but held back by the review limit, for the "done for today" card.
    heldBack: dueAll - due,
    newLeft,
    // Handed to nextCardId, so one page load counts today's answers once.
    today: { reviewsLeft: left, newLeft },
    known,
    total,
    lists: { important: sum("important"), favourite: sum("favourite"), doubt: sum("doubt"), confident: sum("confident") },
  };
}

export async function nextCardId(
  userId: string,
  deck: Deck,
  {
    extra,
    skip = [],
    newPerDay = NEW_PER_DAY,
    reviewsPerDay = 0,
    today,
  }: {
    /** "Keep going": past both daily limits. */
    extra: boolean;
    skip?: string[];
    newPerDay?: number;
    reviewsPerDay?: number;
    /** deckCounts' `today` when the page already has it; counted here if not. */
    today?: { reviewsLeft: number | null; newLeft: number };
  },
): Promise<string | null> {
  const now = new Date();
  const notSkipped = skip.length ? { code: { notIn: skip } } : {};
  const left = extra ? null : today ? today.reviewsLeft : await reviewsLeft(userId, deck.kind, reviewsPerDay, now);
  const due =
    left === null || left > 0
      ? await prisma.cardState.findFirst({
          where: { userId, reviews: { gt: 0 }, dueAt: { lte: now }, word: { ...wordWhere(deck), ...notSkipped } },
          orderBy: { dueAt: "asc" },
          select: { wordId: true },
        })
      : null;
  if (due) return due.wordId;

  if (!extra) {
    const newLeft = today ? today.newLeft : Math.max(0, newPerDay - (await answeredToday(userId, deck.kind, now, true)));
    if (newLeft <= 0) return null;
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
