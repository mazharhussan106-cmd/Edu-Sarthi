// Owns one institute deck for a member: a read-only look at its cards and
// "Copy to my decks". Only decks shared with the viewer's own approved
// institute resolve; any other id is a 404.
//
// It deliberately does NOT offer study on the original (a copy is the
// member's own, with their own schedule) or the public report/like controls —
// institute decks are not part of the public library.

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, faceCard } from "@/lib/decks";
import { instituteDeckScope } from "@/lib/institutes";
import { Card } from "@/components/ui/Card";
import { CardBack, CardFront } from "@/components/decks/CardFace";
import { CopyDeckButton } from "@/components/decks/CopyDeckButton";

export const revalidate = 0;

export default async function InstituteDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const scope = await instituteDeckScope(session!.user.id);
  if (!scope) notFound();

  const deck = await prisma.deck.findFirst({
    where: { id, ...scope },
    select: { title: true, description: true, cards: { orderBy: { serial: "asc" }, select: CARD_SELECT } },
  });
  if (!deck) notFound();
  const cards = await Promise.all(deck.cards.map(faceCard));

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <Link href="/institute" className="text-sm font-medium text-accent hover:underline">← Institute</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{deck.title}</h1>
      {deck.description ? <p className="mt-1 text-sm text-ink-muted">{deck.description}</p> : null}
      <p className="mt-1 font-mono text-xs text-ink-muted">{cards.length} cards</p>
      <div className="mt-4"><CopyDeckButton deckId={id} institute signedIn /></div>
      <p className="mt-2 text-xs text-ink-muted">A copy is private to you. Changes you make to it do not affect the original.</p>
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
