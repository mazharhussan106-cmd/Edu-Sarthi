// Owns the deck editor: the deck's details, its cards, the form for a new
// card, the study button, and the share and delete actions.
//
// Scoped by owner in the query — another student's deck id is a 404 here, not
// a page that fetches and then refuses.
// It deliberately does NOT run a study session (./study).

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, deckStudyCounts, faceCard, isStaff } from "@/lib/decks";
import { DECK_LIMITS } from "@/lib/deckSchemas";
import { Card } from "@/components/ui/Card";
import { CardEditor } from "@/components/decks/CardEditor";
import { CardRow } from "@/components/decks/CardRow";
import { DeckActions } from "@/components/decks/DeckActions";
import { DeckForm } from "@/components/decks/DeckForm";
import { PublishPanel } from "@/components/decks/PublishPanel";

export const revalidate = 0;

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({
    where: { id, ownerId: userId },
    select: { id: true, title: true, description: true, tags: true, shareToken: true, visibility: true, status: true, rejectReason: true, cards: { orderBy: { serial: "asc" }, select: CARD_SELECT } },
  });
  if (!deck) notFound();

  const [counts, staff, cards] = await Promise.all([
    deckStudyCounts(userId, id),
    isStaff(userId),
    Promise.all(
      deck.cards.map(async (c) => ({
        ...(await faceCard(c)),
        imageKey: c.imageUrl,
        audioKey: c.audioUrl,
        videoUrl: c.videoUrl ?? "",
      })),
    ),
  ]);
  const studyable = counts.due + counts.fresh;
  // Learners' recordings on this deck's cards, for the teacher who will audit them.
  const [waiting, audited] = staff
    ? await Promise.all([
        prisma.submission.count({ where: { assignedTeacherId: userId, word: { deckId: id }, status: { in: ["PENDING", "IN_REVIEW"] } } }),
        prisma.submission.count({ where: { assignedTeacherId: userId, word: { deckId: id }, status: "REVIEWED" } }),
      ])
    : [0, 0];

  return (
    <main className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-6 sm:pt-6">
      <Link href="/decks" className="text-sm font-medium text-accent hover:underline">← My decks</Link>
      <h1 className="mt-2 font-display text-xl font-bold text-ink">{deck.title}</h1>

      <Card className="mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-ink-muted">
          <b className="font-mono text-ink">{counts.total}</b> cards · <b className="font-mono text-ink">{counts.due}</b> due · <b className="font-mono text-ink">{counts.fresh}</b> new
        </p>
        {studyable > 0 ? (
          <Link href={`/decks/${id}/study`} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
            Study now
          </Link>
        ) : (
          <span className="text-sm text-ink-muted">{counts.total === 0 ? "Add a card to start." : "Nothing due. Come back later."}</span>
        )}
      </Card>

      {staff ? (
        <Card className="mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-ink-muted">
            Learner recordings on this deck: <b className="font-mono text-ink">{waiting}</b> waiting · <b className="font-mono text-ink">{audited}</b> audited
          </p>
          <Link href="/queue" className="text-sm font-medium text-accent hover:underline">Open the review queue</Link>
        </Card>
      ) : null}

      <section className="mt-6" aria-labelledby="cards-h">
        <h2 id="cards-h" className="font-display text-base font-bold text-ink">Cards</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {cards.map((c) => (
            <li key={c.id}>
              <Card className="p-3"><CardRow deckId={id} card={c} staff={staff} /></Card>
            </li>
          ))}
        </ul>
        {counts.total < DECK_LIMITS.cardsPerDeck ? (
          <Card className="mt-3">
            <h3 className="font-display text-sm font-bold text-ink">Add a card</h3>
            <div className="mt-3"><CardEditor deckId={id} staff={staff} /></div>
          </Card>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">This deck has {DECK_LIMITS.cardsPerDeck} cards, the most allowed. Start a new deck for more.</p>
        )}
      </section>

      <section className="mt-6" aria-labelledby="det-h">
        <h2 id="det-h" className="font-display text-base font-bold text-ink">Deck details</h2>
        <Card className="mt-2"><DeckForm deck={{ id, title: deck.title, description: deck.description, tags: deck.tags }} /></Card>
      </section>

      <section className="mt-6" aria-labelledby="pub-h">
        <h2 id="pub-h" className="sr-only">Public library</h2>
        <Card><PublishPanel deckId={id} visibility={deck.visibility} status={deck.status} rejectReason={deck.rejectReason} cardCount={counts.total} /></Card>
      </section>

      <section className="mt-6" aria-labelledby="share-h">
        <h2 id="share-h" className="font-display text-base font-bold text-ink">Sharing</h2>
        <Card className="mt-2"><DeckActions deckId={id} shareToken={deck.shareToken} cardCount={counts.total} /></Card>
      </section>
    </main>
  );
}
