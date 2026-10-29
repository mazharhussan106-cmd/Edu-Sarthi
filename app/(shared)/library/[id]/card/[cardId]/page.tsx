// Owns one card inside a library deck, shown on the same EduSarthi card as the
// built-in words (frame, three sides that turn, swipe, zoom), with Previous and
// Next in the deck's study order. Only a deck listed in the library resolves
// (lib/decks LISTED: not one whose owner or institute is suspended) — any
// other id is a 404.
//
// It deliberately offers no Known / Unknown here (a copy is the learner's own,
// with their own schedule); "Copy to my decks" is on the deck page.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, LISTED, faceCard } from "@/lib/decks";
import { DEFAULT_PREFERENCES, PREFERENCE_SCHEMA } from "@/lib/preferences";
import { AiBadge } from "@/components/decks/AiBadge";
import { DeckCardView } from "@/components/decks/DeckCardView";

export const revalidate = 0;

// One read serves the page and its metadata (the live pool has one connection).
// Null for anything that is not a card of a listed deck.
const load = cache(async (id: string, cardId: string) => {
  const deck = await prisma.deck.findFirst({
    where: { id, ...LISTED },
    select: { title: true, cards: { orderBy: { serial: "asc" }, select: { id: true } } },
  });
  if (!deck) return null;
  const at = deck.cards.findIndex((c) => c.id === cardId);
  if (at < 0) return null;
  const row = await prisma.word.findFirst({ where: { id: cardId, deckId: id }, select: CARD_SELECT });
  return row ? { deck, at, row } : null;
});

// A visitor reaches a card from its deck, not from a search: hundreds of thin
// pages would only bury the deck pages, so it is `noindex` (its links are still
// followed). It still gets its own title and description, because a visitor can
// share its link and the preview should name the card, not the whole site.
export async function generateMetadata({ params }: { params: Promise<{ id: string; cardId: string }> }): Promise<Metadata> {
  const { id, cardId } = await params;
  const found = await load(id, cardId);
  const robots = { index: false, follow: true };
  if (!found) return { robots };
  return {
    title: `${found.row.text} — ${found.deck.title} — EduSarthi`,
    description: `A flashcard from “${found.deck.title}” in the EduSarthi library.`,
    robots,
  };
}

export default async function LibraryCardPage({ params }: { params: Promise<{ id: string; cardId: string }> }) {
  const [{ id, cardId }, session] = await Promise.all([params, auth()]);
  const found = await load(id, cardId);
  if (!found) notFound();
  const { deck, at, row } = found;

  const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { preferences: true } }) : null;
  const prefs = PREFERENCE_SCHEMA.pick({ cardColor: true }).safeParse(user?.preferences ?? {});
  const face = await faceCard(row);
  const href = (i: number) => (deck.cards[i] ? `/library/${id}/card/${deck.cards[i].id}` : null);

  return (
    <main className="mx-auto max-w-2xl px-3 pb-4 pt-3 sm:px-6 sm:pt-6">
      {/* The card draws its own face; the page still needs one heading, and a
          visitor from outside lands here first. */}
      <h1 className="sr-only">{face.front} — {deck.title}</h1>
      <div className="flex items-center justify-between gap-3">
        <Link href={`/library/${id}`} className="min-w-0 truncate text-sm font-medium text-accent hover:underline">← {deck.title}</Link>
        <span className="shrink-0 font-mono text-xs text-ink-muted">{at + 1} / {deck.cards.length}</span>
      </div>
      {/* Outside the card on purpose: every card keeps the one EduSarthi look. */}
      {face.aiAssisted ? <div className="mt-2"><AiBadge /></div> : null}
      <div className="mt-2">
        <DeckCardView
          key={row.id}
          card={face}
          prevHref={href(at - 1)}
          nextHref={href(at + 1)}
          cardColor={prefs.success ? prefs.data.cardColor : DEFAULT_PREFERENCES.cardColor}
        />
      </div>
    </main>
  );
}
