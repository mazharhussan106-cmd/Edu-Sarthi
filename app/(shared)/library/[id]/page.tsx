// Owns one library deck: a read-only look at its cards, "Copy to my decks",
// and the report button.
//
// Only an APPROVED public deck resolves; any other id is a 404, whatever state
// it is really in. It deliberately does NOT offer study on the original — a
// copy is the learner's own, with their own schedule.

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, cardText } from "@/lib/decks";
import { resolveMediaUrl } from "@/lib/storage";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CardBack, CardFront } from "@/components/decks/CardFace";
import { CopyDeckButton } from "@/components/decks/CopyDeckButton";
import { ReportButton } from "@/components/decks/ReportButton";

export const revalidate = 0;

export default async function LibraryDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const deck = await prisma.deck.findFirst({
    where: { id, visibility: "PUBLIC", status: "APPROVED" },
    select: { title: true, description: true, tags: true, ownerId: true, cards: { orderBy: { serial: "asc" }, select: CARD_SELECT } },
  });
  if (!deck) notFound();

  const cards = await Promise.all(
    deck.cards.map(async (c) => ({
      id: c.id,
      front: c.text,
      ...cardText(c),
      imageSrc: c.imageUrl ? await resolveMediaUrl(c.imageUrl) : null,
      audioSrc: c.audioUrl ? await resolveMediaUrl(c.audioUrl) : null,
    })),
  );
  const own = deck.ownerId === session?.user?.id;

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <Link href="/library" className="text-sm font-medium text-accent hover:underline">← Library</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{deck.title}</h1>
      {deck.description ? <p className="mt-1 text-sm text-ink-muted">{deck.description}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-xs text-ink-muted">{cards.length} cards</span>
        {deck.tags.map((t) => <Link key={t} href={`/library?tag=${encodeURIComponent(t)}`}><Badge>{t}</Badge></Link>)}
      </div>
      <div className="mt-4 flex flex-wrap items-start gap-3">
        <CopyDeckButton deckId={id} signedIn />
        {own ? null : <ReportButton deckId={id} />}
      </div>
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
