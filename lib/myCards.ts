// Owns the student's own card lists across every kind of card, in three rows:
//   Remarks — ⭐ Important, ❤️ Favourite, ❓ Doubt, 💯 Confident, 📝 My notes
//   Answer  — ✅ Known, 🔁 Unknown
//   Level   — 🔴 Hard, 🟡 Medium, 🟢 Easy (of the cards marked Known)
// Built-in words, chunks, grammar and support cards and deck cards all count,
// because every mark lives on CardState for all of them.
//
// It also owns `studyDecks`: which decks this person may study right now and
// the page that opens each. Deck cards in decks they have lost (a follow
// withdrawn, an invitation removed, a deck deleted) are left out of every
// list and count, so a withdrawn deck's cards are never shown from here.
//
// And `listStep`: the next card of a "Study this list" session.
//
// It does not render anything, and it never changes a mark: marking still
// happens only on the card, through /api/flashcards.

import type { CardKind, Prisma, Recall } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { LISTED } from "@/lib/decks";
import { readableBy } from "@/lib/deckAccess";
import { LIST_SIZE, type CardListKey } from "@/lib/cardLists";
import { listParams } from "@/lib/listSession";

export { CARD_LISTS, LIST_ROWS, LIST_SIZE, parseList, type CardListKey } from "@/lib/cardLists";

// reviews > 0 on Known and Unknown: a card only tagged or noted, never
// answered, is neither. The level is read only on Known cards, and Known with
// no level counts as Medium, as it does in the review plan (lib/srs).
const LIST_WHERE: Record<CardListKey, Prisma.CardStateWhereInput> = {
  important: { important: true },
  favourite: { favourite: true },
  doubt: { doubt: true },
  confident: { confident: true },
  notes: { AND: [{ note: { not: null } }, { note: { not: "" } }] },
  known: { known: true, reviews: { gt: 0 } },
  unknown: { known: false, reviews: { gt: 0 } },
  hard: { known: true, reviews: { gt: 0 }, recall: "HARD" },
  medium: { known: true, reviews: { gt: 0 }, OR: [{ recall: "MEDIUM" }, { recall: null }] },
  easy: { known: true, reviews: { gt: 0 }, recall: "EASY" },
};

const LEVEL_NAME: Record<Recall, string> = { HARD: "Hard", MEDIUM: "Medium", EASY: "Easy" };

export type StudyDeck = { title: string; href: string };

/// Decks this person may study now, with the study page for each. Own and
/// shared-by-name decks open on /decks/…/study; followed library decks on
/// /library/…/study, and only while listed (the same rule that page applies).
/// A working copy (new version) is never studied, so it is never here.
export async function studyDecks(userId: string): Promise<Map<string, StudyDeck>> {
  const [mine, followed] = await Promise.all([
    // The study page's own rule (app/(shared)/decks/[id]/study), so a link from
    // here can never open a deck that page would refuse.
    prisma.deck.findMany({ where: { draftOfId: null, ...readableBy(userId) }, select: { id: true, title: true } }),
    prisma.deck.findMany({ where: { ...LISTED, draftOfId: null, follows: { some: { userId } } }, select: { id: true, title: true } }),
  ]);
  const map = new Map<string, StudyDeck>();
  for (const d of followed) map.set(d.id, { title: d.title, href: `/library/${d.id}/study` });
  // Set second so a deck that is both shared and followed opens as shared.
  for (const d of mine) map.set(d.id, { title: d.title, href: `/decks/${d.id}/study` });
  return map;
}

/// Built-in cards, or cards in a deck this person may study now.
function reachable(deckIds: string[]): Prisma.CardStateWhereInput {
  return { word: { OR: [{ deckId: null }, { deckId: { in: deckIds } }] } };
}

export type ListedCard = {
  id: string;
  kind: CardKind;
  text: string;
  note: string | null;
  /// Every mark on the card at a glance, e.g. "⭐ ❓ · Known · Hard".
  marks: string;
  /// Where the card opens: the Flashcard tab for built-in cards, its deck's
  /// study page otherwise.
  href: string;
  /// The deck's name for a deck card; null for a built-in card.
  deck: string | null;
};

type Marks = { important: boolean; favourite: boolean; doubt: boolean; confident: boolean; known: boolean; recall: Recall | null; reviews: number };

function marksOf(s: Marks): string {
  const remarks = [s.important && "⭐", s.favourite && "❤️", s.doubt && "❓", s.confident && "💯"].filter(Boolean).join(" ");
  const answer = s.reviews === 0 ? "Not answered yet" : s.known ? `Known · ${LEVEL_NAME[s.recall ?? "MEDIUM"]}` : "Unknown";
  return [remarks, answer].filter(Boolean).join(" · ");
}

export async function cardList(userId: string, list: CardListKey) {
  const decks = await studyDecks(userId);
  const base: Prisma.CardStateWhereInput = { userId, ...reachable([...decks.keys()]) };

  // Three grouped reads give all ten counts, instead of a count per list.
  const [rows, flags, answers, notes] = await Promise.all([
    prisma.cardState.findMany({
      where: { AND: [base, LIST_WHERE[list]] },
      // Most recently answered first: what the student was just working on.
      orderBy: [{ lastReviewedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: LIST_SIZE,
      select: {
        id: true, note: true, important: true, favourite: true, doubt: true, confident: true, known: true, recall: true, reviews: true,
        word: { select: { kind: true, code: true, text: true, deckId: true } },
      },
    }),
    prisma.cardState.groupBy({
      by: ["important", "favourite", "doubt", "confident"],
      where: { AND: [base, { OR: [{ important: true }, { favourite: true }, { doubt: true }, { confident: true }] }] },
      _count: true,
    }),
    prisma.cardState.groupBy({ by: ["known", "recall"], where: { AND: [base, { reviews: { gt: 0 } }] }, _count: true }),
    prisma.cardState.count({ where: { AND: [base, LIST_WHERE.notes] } }),
  ]);

  const flag = (test: (g: (typeof flags)[number]) => boolean) => flags.filter(test).reduce((n, g) => n + g._count, 0);
  const answered = (test: (g: (typeof answers)[number]) => boolean) => answers.filter(test).reduce((n, g) => n + g._count, 0);
  const counts: Record<CardListKey, number> = {
    important: flag((g) => g.important),
    favourite: flag((g) => g.favourite),
    doubt: flag((g) => g.doubt),
    confident: flag((g) => g.confident),
    notes,
    known: answered((g) => g.known),
    unknown: answered((g) => !g.known),
    hard: answered((g) => g.known && g.recall === "HARD"),
    medium: answered((g) => g.known && (g.recall === "MEDIUM" || g.recall === null)),
    easy: answered((g) => g.known && g.recall === "EASY"),
  };

  const cards: ListedCard[] = rows.map((r) => ({
    id: r.id,
    kind: r.word.kind,
    text: r.word.text,
    note: r.note?.trim() || null,
    marks: marksOf(r),
    href: cardHref(r.word, decks),
    deck: (r.word.deckId && decks.get(r.word.deckId)?.title) || null,
  }));

  return { cards, counts };
}

/// Where a card is studied: the Flashcard tab for a built-in card, its deck's
/// study page otherwise. Every caller has already left out unreachable decks.
function cardHref(word: { code: string; deckId: string | null }, decks: Map<string, StudyDeck>): string {
  const card = encodeURIComponent(word.code);
  const deck = word.deckId ? decks.get(word.deckId) : null;
  return deck ? `${deck.href}?card=${card}` : `/flashcards?card=${card}`;
}

/// One step of a "Study this list" session (app/(student)/my-cards/study):
/// the next card of the list after `after`, or the card `card` when ‹ asked
/// for it, as the URL that opens it with the session attached (lib/listSession).
/// Cards go in a fixed order, oldest mark first (CardState id), so a card that
/// leaves the list once answered — Unknown marked Known — cannot make the
/// session skip or repeat one. `done` when nothing is left; `total` is how many
/// the list holds now.
export async function listStep(
  userId: string,
  list: CardListKey,
  at: { after?: string; card?: string },
): Promise<{ href: string } | { done: true; total: number }> {
  const decks = await studyDecks(userId);
  const base: Prisma.CardStateWhereInput = { userId, ...reachable([...decks.keys()]) };
  const inList: Prisma.CardStateWhereInput = { AND: [base, LIST_WHERE[list]] };
  const select = { id: true, word: { select: { code: true, deckId: true } } } as const;

  // ‹ may go back to a card that has since left the list; it is still the
  // person's own card, so it opens, and the session carries on after it.
  const target =
    (at.card ? await prisma.cardState.findFirst({ where: { AND: [base, { word: { code: at.card } }] }, select }) : null) ??
    (await prisma.cardState.findFirst({
      where: at.after ? { AND: [inList, { id: { gt: at.after } }] } : inList,
      orderBy: { id: "asc" },
      select,
    }));
  if (!target) return { done: true, total: await prisma.cardState.count({ where: inList }) };

  const left = await prisma.cardState.count({ where: { AND: [inList, { id: { gt: target.id } }] } });
  return { href: cardHref(target.word, decks) + listParams(list, target.id, left) };
}
