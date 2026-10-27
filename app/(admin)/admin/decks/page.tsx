// Owns the admin queue for the public deck library: decks and new versions
// waiting for review, published decks with open reports, and small fixes that
// went live without waiting. Oldest first, so nothing waits behind newer work.
//
// Deck decisions are deliberately NOT here — they are on the deck's own review
// page, where the admin has seen every card first. A small fix is one card's
// text before and after, so Accept and Undo sit beside it.

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { aiCardCounts } from "@/lib/decks";
import { AiBadge } from "@/components/decks/AiBadge";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ensureActiveUser } from "@/lib/activeUser";
import { ActionButton } from "@/components/admin/ActionButton";

const FIELD: Record<string, string> = { front: "Front", back: "Back", example: "Example", body: "Notes" };

export const revalidate = 0;

export default async function AdminDecksPage() {
  // Re-checked in the page itself: a layout is not re-run on a client-side
  // navigation, and the role in the token can be older than a demotion.
  await ensureActiveUser(["ADMIN"]);
  const [pending, reported, fixes] = await Promise.all([
    prisma.deck.findMany({
      where: { visibility: "PUBLIC", status: "PENDING_REVIEW" },
      orderBy: { updatedAt: "asc" },
      // Oldest 100 first: a queue longer than that is a staffing problem, not a page problem.
      take: 100,
      select: { id: true, title: true, updatedAt: true, draftOf: { select: { title: true } }, _count: { select: { cards: true, reports: { where: { resolvedAt: null } } } } },
    }),
    prisma.deck.findMany({
      where: { reports: { some: { resolvedAt: null } } },
      orderBy: { updatedAt: "asc" },
      take: 100,
      select: { id: true, title: true, status: true, _count: { select: { reports: { where: { resolvedAt: null } } } } },
    }),
    prisma.deckChange.findMany({
      where: { reviewedAt: null },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: { id: true, before: true, after: true, createdAt: true, deck: { select: { id: true, title: true } } },
    }),
  ]);

  const aiCards = await aiCardCounts([...pending, ...reported].map((d) => d.id));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Deck review</h1>
      <p className="mt-1 text-sm text-ink-muted">Nothing reaches the public library until it is approved here.</p>

      <h2 className="mt-8 font-display text-base font-bold text-ink">Waiting for review ({pending.length})</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {pending.length === 0 ? <li><Card className="text-sm text-ink-muted">No decks are waiting. Nice.</Card></li> : null}
        {pending.map((d) => (
          <li key={d.id}>
            <Link href={`/admin/decks/${d.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 hover:bg-hover">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{d.draftOf ? `New version of “${d.draftOf.title}”` : d.title}</span>
                  <span className="block text-xs text-ink-muted">Submitted {d.updatedAt.toLocaleDateString("en-IN")} · {d._count.cards} cards</span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  {aiCards.get(d.id) ? <AiBadge label={`${aiCards.get(d.id)} AI-assisted`} /> : null}
                  {d._count.reports ? <Badge variant="error">{d._count.reports} reports</Badge> : <Badge variant="accent">Review</Badge>}
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-display text-base font-bold text-ink">Reported ({reported.length})</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {reported.length === 0 ? <li><Card className="text-sm text-ink-muted">No open reports.</Card></li> : null}
        {reported.map((d) => (
          <li key={d.id}>
            <Link href={`/admin/decks/${d.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 hover:bg-hover">
                <span className="truncate font-medium text-ink">{d.title}</span>
                <span className="flex shrink-0 gap-1.5">
                  {aiCards.get(d.id) ? <AiBadge label={`${aiCards.get(d.id)} AI-assisted`} /> : null}
                  <Badge variant="error">{d._count.reports} open</Badge>
                  {d.status === "PENDING_REVIEW" ? <Badge>hidden</Badge> : null}
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-display text-base font-bold text-ink">Fixes to check ({fixes.length})</h2>
      <p className="text-xs text-ink-muted">Small fixes to published decks go live at once. Undo puts the old text back and emails the creator your reason.</p>
      <ul className="mt-2 flex flex-col gap-2">
        {fixes.length === 0 ? <li><Card className="text-sm text-ink-muted">No fixes waiting.</Card></li> : null}
        {fixes.map((f) => {
          const before = f.before as Record<string, string>;
          const after = f.after as Record<string, string>;
          return (
            <li key={f.id}>
              <Card className="flex flex-col gap-2 p-4">
                <p className="text-xs text-ink-muted">
                  <Link href={`/library/${f.deck.id}`} className="font-medium text-accent hover:underline">{f.deck.title}</Link> · {f.createdAt.toLocaleString("en-IN")}
                </p>
                <ul className="flex flex-col gap-1 text-sm text-ink">
                  {Object.keys(after).map((k) => (
                    <li key={k}><b>{FIELD[k] ?? k}:</b> <s className="text-ink-muted">{before[k] || "(empty)"}</s> → {after[k] || "(empty)"}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <ActionButton url="/api/admin/decks" body={{ action: "acceptFix", id: f.id }} label="Accept" variant="outline" />
                  <ActionButton url="/api/admin/decks" body={{ action: "undoFix", id: f.id }} label="Undo" askReason />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
