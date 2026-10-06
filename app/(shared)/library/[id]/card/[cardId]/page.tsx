// Owns one full imported card inside a library deck: the three-side card, with
// Previous and Next in the deck's study order. Only an approved public deck
// resolves — any other id is a 404.
//
// It deliberately offers no study here (a copy is the learner's own, with their
// own schedule); "Copy to my decks" is on the deck page.

import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { CARD_SELECT, faceCard } from "@/lib/decks";
import { Card } from "@/components/ui/Card";
import { RichCard } from "@/components/decks/RichCard";

export const revalidate = 0;

export default async function LibraryCardPage({ params }: { params: Promise<{ id: string; cardId: string }> }) {
  const { id, cardId } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id, visibility: "PUBLIC", status: "APPROVED" },
    select: { title: true, cards: { orderBy: { serial: "asc" }, select: { id: true } } },
  });
  if (!deck) notFound();
  const at = deck.cards.findIndex((c) => c.id === cardId);
  if (at < 0) notFound();
  const row = await prisma.word.findFirst({ where: { id: cardId, deckId: id }, select: CARD_SELECT });
  if (!row) notFound();
  const card = await faceCard(row);
  const prev = deck.cards[at - 1]?.id;
  const next = deck.cards[at + 1]?.id;
  const nav = "inline-flex h-10 items-center rounded-lg border border-border-strong px-4 text-sm text-ink hover:bg-hover";

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/library/${id}`} className="min-w-0 truncate text-sm font-medium text-accent hover:underline">← {deck.title}</Link>
        <span className="shrink-0 font-mono text-xs text-ink-muted">{at + 1} / {deck.cards.length}</span>
      </div>
      <Card className="mt-3">
        {card.rich ? <RichCard key={card.id} rich={card.rich} /> : <p className="text-ink">{card.front}</p>}
      </Card>
      <div className="mt-3 flex justify-between gap-2">
        {prev ? <Link href={`/library/${id}/card/${prev}`} className={nav}>← Previous</Link> : <span />}
        {next ? <Link href={`/library/${id}/card/${next}`} className={nav}>Next →</Link> : <span />}
      </div>
    </main>
  );
}
