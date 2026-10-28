// Owns the student's own card lists across every kind of card: the ones they
// saved (⭐ Important, ❤️ Favourite), doubted, wrote a note on, marked Unknown,
// or are confident about. Built-in words, chunks, grammar and support cards
// and deck cards all count, because the remarks live on CardState for all of
// them.
//
// It also owns `studyDecks`: which decks this person may study right now and
// the page that opens each. Deck cards in decks they have lost (a follow
// withdrawn, an invitation removed, a deck deleted) are left out of every
// list and count, so a withdrawn deck's cards are never shown from here.
//
// It does not render anything, and it never changes a remark: marking still
// happens only on the card, through /api/flashcards.

import type { CardKind, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { LISTED } from "@/lib/decks";
import { readableBy } from "@/lib/deckAccess";

export const CARD_LISTS = [
  { value: "saved", label: "⭐❤️ Saved", empty: "Tap ⭐ Important or ❤️ Favourite on any card to keep it here." },
  { value: "unknown", label: "🔁 Marked Unknown", empty: "Cards you mark Unknown come here until you mark them Known." },
  { value: "doubt", label: "❓ Doubt", empty: "Tap ❓ Doubt on a card you want to ask about or check again." },
  { value: "notes", label: "📝 My notes", empty: "Write a note in a card's Remark box and it shows here." },
  { value: "confident", label: "💯 Confident", empty: "Tap 💯 Confident on a card you are sure of." },
] as const;
export type CardListKey = (typeof CARD_LISTS)[number]["value"];

export const LIST_SIZE = 100;

export function parseList(raw: string | undefined): CardListKey {
  return CARD_LISTS.find((l) => l.value === raw)?.value ?? "saved";
}

const LIST_WHERE: Record<CardListKey, Prisma.CardStateWhereInput> = {
  saved: { OR: [{ important: true }, { favourite: true }] },
  // reviews > 0: a card only tagged or noted, never answered, is not "Unknown".
  unknown: { known: false, reviews: { gt: 0 } },
  doubt: { doubt: true },
  notes: { AND: [{ note: { not: null } }, { note: { not: "" } }] },
  confident: { confident: true },
};

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
  /// Where the card opens: the Flashcard tab for built-in cards, its deck's
  /// study page otherwise.
  href: string;
  /// The deck's name for a deck card; null for a built-in card.
  deck: string | null;
};

export async function cardList(userId: string, list: CardListKey) {
  const decks = await studyDecks(userId);
  const base: Prisma.CardStateWhereInput = { userId, ...reachable([...decks.keys()]) };

  const [rows, flags, notes, unknown] = await Promise.all([
    prisma.cardState.findMany({
      where: { ...base, ...LIST_WHERE[list] },
      // Most recently answered first: what the student was just working on.
      orderBy: [{ lastReviewedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: LIST_SIZE,
      select: { id: true, note: true, word: { select: { kind: true, code: true, text: true, deckId: true } } },
    }),
    // One grouped read for the four remark flags instead of four counts.
    prisma.cardState.groupBy({
      by: ["important", "favourite", "doubt", "confident"],
      where: { ...base, OR: [{ important: true }, { favourite: true }, { doubt: true }, { confident: true }] },
      _count: true,
    }),
    prisma.cardState.count({ where: { ...base, ...LIST_WHERE.notes } }),
    prisma.cardState.count({ where: { ...base, ...LIST_WHERE.unknown } }),
  ]);

  const sum = (test: (g: (typeof flags)[number]) => boolean) => flags.filter(test).reduce((n, g) => n + g._count, 0);
  const counts: Record<CardListKey, number> = {
    saved: sum((g) => g.important || g.favourite),
    unknown,
    doubt: sum((g) => g.doubt),
    notes,
    confident: sum((g) => g.confident),
  };

  const cards: ListedCard[] = rows.map((r) => {
    const deck = r.word.deckId ? decks.get(r.word.deckId) : null;
    const card = encodeURIComponent(r.word.code);
    return {
      id: r.id,
      kind: r.word.kind,
      text: r.word.text,
      note: r.note?.trim() || null,
      href: deck ? `${deck.href}?card=${card}` : `/flashcards?card=${card}`,
      deck: deck?.title ?? null,
    };
  });

  return { cards, counts };
}
