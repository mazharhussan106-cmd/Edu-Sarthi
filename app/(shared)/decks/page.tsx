// Owns the "My decks" page: the student's own decks with how many cards are
// due in each, and the form to start a new one.
//
// It deliberately does NOT show other people's decks — shared decks open from
// their link, and the public library is a later phase.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DECK_LIMITS } from "@/lib/deckSchemas";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DeckForm } from "@/components/decks/DeckForm";

export const revalidate = 0;

export default async function DecksPage() {
  const session = await auth();
  const userId = session!.user.id;
  const staff = session!.user.role !== "STUDENT";
  const decks = await prisma.deck.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, tags: true, shareToken: true, visibility: true, status: true, _count: { select: { cards: true } } },
  });
  const now = new Date();
  const dueRows = await prisma.cardState.groupBy({
    by: ["wordId"],
    where: { userId, dueAt: { lte: now }, word: { ownerId: userId, deckId: { not: null } } },
  });
  // Due per deck: one extra read of the due cards' decks rather than a count
  // per deck, so the page costs three queries however many decks there are.
  const dueWords = dueRows.length
    ? await prisma.word.findMany({ where: { id: { in: dueRows.map((r) => r.wordId) } }, select: { deckId: true } })
    : [];
  const due = new Map<string, number>();
  for (const w of dueWords) if (w.deckId) due.set(w.deckId, (due.get(w.deckId) ?? 0) + 1);

  return (
    <main className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-ink">My decks</h1>
        {staff ? null : <Link href="/flashcards" className="text-sm font-medium text-accent hover:underline">← Word cards</Link>}
      </div>
      <p className="mt-1 text-sm text-ink-muted">Make your own cards. Decks are private until you share a link or submit one to the library.</p>

      <ul className="mt-4 flex flex-col gap-2">
        {decks.length === 0 ? (
          <li>
            <Card className="text-center text-sm text-ink-muted">You have no decks yet. Name your first one below.</Card>
          </li>
        ) : null}
        {decks.map((d) => (
          <li key={d.id}>
            <Link href={`/decks/${d.id}`} className="block">
              <Card className="p-4 hover:bg-hover">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-display font-bold text-ink">{d.title}</span>
                    {d.description ? <span className="block truncate text-xs text-ink-muted">{d.description}</span> : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-xs text-ink-muted">{d._count.cards} cards</span>
                    {due.get(d.id) ? <Badge variant="accent">{due.get(d.id)} due</Badge> : null}
                    {d.visibility === "PUBLIC" && d.status === "PENDING_REVIEW" ? <Badge variant="accent">in review</Badge> : null}
                    {d.visibility === "PUBLIC" && d.status === "APPROVED" ? <Badge variant="success">published</Badge> : null}
                    {d.status === "REJECTED" ? <Badge variant="error">not approved</Badge> : null}
                    {d.shareToken ? <Badge>shared by link</Badge> : null}
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <Card className="mt-6">
        <h2 className="font-display text-base font-bold text-ink">New deck</h2>
        {decks.length >= DECK_LIMITS.decksPerUser ? (
          <p className="mt-2 text-sm text-ink-muted">You have {DECK_LIMITS.decksPerUser} decks, the most allowed. Delete one you no longer need to start another.</p>
        ) : (
          <div className="mt-3"><DeckForm /></div>
        )}
      </Card>
    </main>
  );
}
