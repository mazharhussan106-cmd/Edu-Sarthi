// Owns the admin queue for the public deck library: decks waiting for review,
// and published decks with open reports. Oldest first, so nothing waits behind
// newer submissions.
//
// It deliberately does NOT show the decisions' controls — those are on the
// deck's own review page, where the admin has seen every card first.

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ensureActiveUser } from "@/lib/activeUser";

export const revalidate = 0;

export default async function AdminDecksPage() {
  // Re-checked in the page itself: a layout is not re-run on a client-side
  // navigation, and the role in the token can be older than a demotion.
  await ensureActiveUser(["ADMIN"]);
  const [pending, reported] = await Promise.all([
    prisma.deck.findMany({
      where: { visibility: "PUBLIC", status: "PENDING_REVIEW" },
      orderBy: { updatedAt: "asc" },
      // Oldest 100 first: a queue longer than that is a staffing problem, not a page problem.
      take: 100,
      select: { id: true, title: true, updatedAt: true, _count: { select: { cards: true, reports: { where: { resolvedAt: null } } } } },
    }),
    prisma.deck.findMany({
      where: { reports: { some: { resolvedAt: null } } },
      orderBy: { updatedAt: "asc" },
      take: 100,
      select: { id: true, title: true, status: true, _count: { select: { reports: { where: { resolvedAt: null } } } } },
    }),
  ]);

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
                  <span className="block truncate font-medium text-ink">{d.title}</span>
                  <span className="block text-xs text-ink-muted">Submitted {d.updatedAt.toLocaleDateString("en-IN")} · {d._count.cards} cards</span>
                </span>
                {d._count.reports ? <Badge variant="error">{d._count.reports} reports</Badge> : <Badge variant="accent">Review</Badge>}
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
                  <Badge variant="error">{d._count.reports} open</Badge>
                  {d.status === "PENDING_REVIEW" ? <Badge>hidden</Badge> : null}
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
