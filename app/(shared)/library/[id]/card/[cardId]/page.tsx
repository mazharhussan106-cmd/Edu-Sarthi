// Owns one card inside a library deck, shown on the same EduSarthi card as the
// built-in words (frame, three sides that turn, swipe, zoom), with Previous and
// Next in the deck's study order. Only an approved public deck resolves — any
// other id is a 404.
//
// It deliberately offers no Known / Unknown here (a copy is the learner's own,
// with their own schedule); "Copy to my decks" is on the deck page.

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, faceCard } from "@/lib/decks";
import { DEFAULT_PREFERENCES, PREFERENCE_SCHEMA } from "@/lib/preferences";
import { DeckCardView } from "@/components/decks/DeckCardView";

export const revalidate = 0;

export default async function LibraryCardPage({ params }: { params: Promise<{ id: string; cardId: string }> }) {
  const [{ id, cardId }, session] = await Promise.all([params, auth()]);
  const deck = await prisma.deck.findFirst({
    where: { id, visibility: "PUBLIC", status: "APPROVED" },
    select: { title: true, cards: { orderBy: { serial: "asc" }, select: { id: true } } },
  });
  if (!deck) notFound();
  const at = deck.cards.findIndex((c) => c.id === cardId);
  if (at < 0) notFound();

  const [row, user] = await Promise.all([
    prisma.word.findFirst({ where: { id: cardId, deckId: id }, select: CARD_SELECT }),
    session?.user?.id ? prisma.user.findUnique({ where: { id: session.user.id }, select: { preferences: true } }) : null,
  ]);
  if (!row) notFound();
  const prefs = PREFERENCE_SCHEMA.pick({ cardColor: true }).safeParse(user?.preferences ?? {});
  const href = (i: number) => (deck.cards[i] ? `/library/${id}/card/${deck.cards[i].id}` : null);

  return (
    <main className="mx-auto max-w-2xl px-3 pb-4 pt-3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/library/${id}`} className="min-w-0 truncate text-sm font-medium text-accent hover:underline">← {deck.title}</Link>
        <span className="shrink-0 font-mono text-xs text-ink-muted">{at + 1} / {deck.cards.length}</span>
      </div>
      <div className="mt-2">
        <DeckCardView
          key={row.id}
          card={await faceCard(row)}
          prevHref={href(at - 1)}
          nextHref={href(at + 1)}
          cardColor={prefs.success ? prefs.data.cardColor : DEFAULT_PREFERENCES.cardColor}
        />
      </div>
    </main>
  );
}
