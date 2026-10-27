// Owns the page a person sees for a deck shared with them by name to view:
// the cards to read, Study (with their own progress), Make my own copy, and
// Leave. Editors can open it too.
//
// Scoped in the query to accepted members of this deck; anyone else gets a 404.
// It deliberately does NOT allow changes — editing is /decks/[id], for editors.

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, faceCard } from "@/lib/decks";
import { SOURCE_SELECT, copiedFrom } from "@/lib/libraryTerms";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CardBack, CardFront } from "@/components/decks/CardFace";
import { CopyDeckButton } from "@/components/decks/CopyDeckButton";
import { DeckCredit } from "@/components/decks/DeckCredit";
import { LeaveButton } from "@/components/decks/InviteList";

export const revalidate = 0;

export default async function SharedDeckForMePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({
    where: { id, draftOfId: null, members: { some: { userId, acceptedAt: { not: null } } } },
    select: { title: true, description: true, tags: true, owner: { select: { name: true } }, ...SOURCE_SELECT, cards: { orderBy: { serial: "asc" }, select: CARD_SELECT } },
  });
  if (!deck) notFound();
  const cards = await Promise.all(deck.cards.map(faceCard));

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <Link href="/decks" className="text-sm font-medium text-accent hover:underline">← My decks</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{deck.title}</h1>
      {deck.description ? <p className="mt-1 text-sm text-ink-muted">{deck.description}</p> : null}
      <p className="mt-1 text-xs text-ink-muted">Shared with you by {deck.owner.name?.trim() || "its owner"}.</p>
      <DeckCredit source={copiedFrom(deck)} linked className="mt-0.5" />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-xs text-ink-muted">{cards.length} cards</span>
        {deck.tags.map((t) => <Badge key={t}>{t}</Badge>)}
      </div>
      <div className="mt-4 flex flex-wrap items-start gap-2">
        <Link href={`/decks/${id}/study`} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">Study</Link>
        <CopyDeckButton deckId={id} shared signedIn label="Make my own copy" variant="outline" />
        <LeaveButton deckId={id} />
      </div>
      <p className="mt-2 text-xs text-ink-muted">You study the owner’s latest version with your own progress. A copy is yours to change, and never updates.</p>

      <ul className="mt-5 flex flex-col gap-3">
        {cards.map((c) => (
          <li key={c.id}>
            <Card className="flex flex-col gap-3 p-4">
              <CardFront card={c} />
              <hr className="border-border" />
              <CardBack card={c} />
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
