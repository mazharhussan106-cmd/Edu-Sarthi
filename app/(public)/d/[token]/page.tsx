// Owns the page behind a deck's share link: a read-only view of the deck and
// a button to copy it into the viewer's own account.
//
// Readable signed out — possession of the link is the permission. It
// deliberately shows no owner name or email (the link goes to people the owner
// chose, but the page can be forwarded), and asks search engines not to index
// it. It does NOT let the viewer change or study the original; a copy is theirs.

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, cardText } from "@/lib/decks";
import { resolveMediaUrl } from "@/lib/storage";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CardBack, CardFront } from "@/components/decks/CardFace";
import { CopyDeckButton } from "@/components/decks/CopyDeckButton";

export const revalidate = 0;
export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Shared flashcard deck" };

export default async function SharedDeckPage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, session] = await Promise.all([params, auth()]);

  const deck = await prisma.deck.findFirst({
    where: { shareToken: token, visibility: "LINK" },
    select: { title: true, description: true, tags: true, cards: { orderBy: { serial: "asc" }, select: CARD_SELECT } },
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

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-4 sm:px-6 sm:pt-8">
      <h1 className="font-display text-2xl font-bold text-ink">{deck.title}</h1>
      {deck.description ? <p className="mt-1 text-sm text-ink-muted">{deck.description}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-xs text-ink-muted">{cards.length} cards</span>
        {deck.tags.map((t) => <Badge key={t}>{t}</Badge>)}
      </div>
      <div className="mt-4"><CopyDeckButton token={token} signedIn={Boolean(session?.user?.id)} /></div>
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
