// Owns a study session on one of the student's own decks: the next card by
// the review ladder (due first, then new), or the "done" message.
//
// The card is chosen here, on the server, so a refresh never skips or repeats
// one. It deliberately does NOT save answers — StudyCard posts them to
// /api/flashcards, the same endpoint the built-in cards use.

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, deckStudyCounts, faceCard, nextDeckCardId } from "@/lib/decks";
import { Card } from "@/components/ui/Card";
import { StudyCard } from "@/components/decks/StudyCard";

export const revalidate = 0;

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({ where: { id, ownerId: userId }, select: { title: true } });
  if (!deck) notFound();

  const [counts, wordId] = await Promise.all([deckStudyCounts(userId, id), nextDeckCardId(userId, id)]);
  const word = wordId ? await prisma.word.findFirst({ where: { id: wordId, deckId: id, ownerId: userId }, select: CARD_SELECT }) : null;

  return (
    <main className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/decks/${id}`} className="text-sm font-medium text-accent hover:underline">← {deck.title}</Link>
        <p className="text-xs text-ink-muted">
          <b className="font-mono text-ink">{counts.due}</b> due · <b className="font-mono text-ink">{counts.fresh}</b> new
        </p>
      </div>
      <div className="mt-3">
        {word ? (
          <StudyCard
            key={word.id}
            wordId={word.id}
            card={await faceCard(word)}
          />
        ) : (
          <Card className="text-center">
            <p className="font-display text-lg font-bold text-ink">{counts.total === 0 ? "This deck has no cards yet" : "Done for now"}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {counts.total === 0 ? "Add a few cards, then come back to study." : "No cards are due. Coming back later is what makes them stick."}
            </p>
            <Link href={`/decks/${id}`} className="mt-4 inline-flex h-10 items-center rounded-lg border border-border-strong px-4 text-sm text-ink hover:bg-hover">
              Back to the deck
            </Link>
          </Card>
        )}
      </div>
    </main>
  );
}
