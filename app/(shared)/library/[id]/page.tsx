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
import { CARD_SELECT, faceCard } from "@/lib/decks";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CardBack, CardFront } from "@/components/decks/CardFace";
import { CopyDeckButton } from "@/components/decks/CopyDeckButton";
import { LikeButton } from "@/components/decks/LikeButton";
import { ReportButton } from "@/components/decks/ReportButton";

export const revalidate = 0;

export default async function LibraryDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const deck = await prisma.deck.findFirst({
    where: { id, visibility: "PUBLIC", status: "APPROVED" },
    select: { title: true, description: true, tags: true, ownerId: true, owner: { select: { role: true, teacherVerifiedAt: true } }, _count: { select: { likes: true } }, cards: { orderBy: { serial: "asc" }, select: CARD_SELECT } },
  });
  if (!deck) notFound();

  const cards = await Promise.all(deck.cards.map(faceCard));
  const own = deck.ownerId === session?.user?.id;
  const liked = session?.user?.id ? (await prisma.deckLike.count({ where: { deckId: id, userId: session.user.id } })) > 0 : false;
  // Recording for the teacher is offered on a verified teacher's deck, to students.
  const canRecord = session?.user?.role === "STUDENT" && deck.owner.role === "TEACHER" && Boolean(deck.owner.teacherVerifiedAt);

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <Link href="/library" className="text-sm font-medium text-accent hover:underline">← Library</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{deck.title}</h1>
      {deck.description ? <p className="mt-1 text-sm text-ink-muted">{deck.description}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-xs text-ink-muted">{cards.length} cards</span>
        {deck.owner.role === "TEACHER" && deck.owner.teacherVerifiedAt ? <Badge variant="success">Verified teacher</Badge> : null}
        {deck.tags.map((t) => <Link key={t} href={`/library?tag=${encodeURIComponent(t)}`}><Badge>{t}</Badge></Link>)}
      </div>
      <div className="mt-4 flex flex-wrap items-start gap-3">
        <CopyDeckButton deckId={id} signedIn />
        <LikeButton deckId={id} likes={deck._count.likes} liked={liked} disabled={own} />
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
              {canRecord ? (
                <Link href={`/library/${id}/practice/${c.id}`} className="inline-flex h-9 w-fit items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover">
                  🎙 Record yourself — the teacher will audit it
                </Link>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
