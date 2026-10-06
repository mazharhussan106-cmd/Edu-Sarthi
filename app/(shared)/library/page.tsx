// Owns the public library: decks an admin has approved, with search and a tag
// filter. Open to every signed-in role.
//
// Only APPROVED + PUBLIC decks are queried — a deck waiting for review, rejected
// or pulled after reports is simply not here. It shows no owner name: credit and
// licence are still undecided, so nothing is attributed yet.
// It deliberately does NOT list the viewer's own drafts (that is My decks).

import Link from "next/link";
import { Search } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const revalidate = 0;

const SORTS = [
  { value: "new", label: "Newest" },
  { value: "liked", label: "Most liked" },
  { value: "copied", label: "Most copied" },
] as const;

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string; sort?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const tag = (sp.tag ?? "").trim().toLowerCase().slice(0, 24);
  const sort = SORTS.some((x) => x.value === sp.sort) ? (sp.sort as string) : "new";

  const decks = await prisma.deck.findMany({
    where: {
      visibility: "PUBLIC",
      status: "APPROVED",
      // A suspended owner's decks are not shown while the suspension lasts.
      owner: { suspendedAt: null },
      ...(tag ? { tags: { has: tag } } : {}),
      ...(q
        ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { tags: { has: q.toLowerCase() } }] }
        : {}),
    },
    // Newest is the tiebreak, so equal counts do not shuffle between loads.
    orderBy: sort === "liked" ? [{ likes: { _count: "desc" } }, { reviewedAt: "desc" }] : sort === "copied" ? [{ copyCount: "desc" }, { reviewedAt: "desc" }] : [{ reviewedAt: "desc" }],
    take: 30,
    select: { id: true, title: true, description: true, tags: true, owner: { select: { role: true, teacherVerifiedAt: true } }, _count: { select: { cards: true, likes: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-ink">Deck library</h1>
        <Link href="/decks" className="text-sm font-medium text-accent hover:underline">My decks</Link>
      </div>
      <p className="mt-1 text-sm text-ink-muted">Decks shared by other learners, checked by an admin before they appear. Copy one to study it.</p>

      <form action="/library" className="relative mt-3">
        <label htmlFor="lib-search" className="sr-only">Search the library</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" aria-hidden="true" />
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        <input type="hidden" name="sort" value={sort} />
        <input id="lib-search" name="q" type="search" defaultValue={q} placeholder="Search decks or tags" className="h-9 w-full rounded-full border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent" />
      </form>
      <nav aria-label="Sort decks" className="mt-2 flex gap-1.5">
        {SORTS.map((x) => (
          <Link
            key={x.value}
            href={`/library?${new URLSearchParams({ ...(q ? { q } : {}), ...(tag ? { tag } : {}), sort: x.value })}`}
            aria-current={x.value === sort ? "page" : undefined}
            className={x.value === sort ? "rounded-full bg-accent px-3 py-1 text-[13px] font-medium text-on-accent" : "rounded-full border border-border-strong px-3 py-1 text-[13px] text-ink hover:bg-hover"}
          >
            {x.label}
          </Link>
        ))}
      </nav>
      {tag ? (
        <p className="mt-2 text-sm text-ink-muted">
          Tag: <Badge variant="accent">{tag}</Badge> <Link href="/library" className="ml-1 text-accent hover:underline">clear</Link>
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-2">
        {decks.length === 0 ? (
          <li>
            <Card className="text-center text-sm text-ink-muted">
              {q || tag ? "No deck matches that. Try a shorter word." : "No decks are published yet. Make one in My decks and submit it."}
            </Card>
          </li>
        ) : null}
        {decks.map((d) => (
          <li key={d.id}>
            <Link href={`/library/${d.id}`} className="block">
              <Card className="p-4 hover:bg-hover">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-display font-bold text-ink">{d.title}</span>
                    {d.description ? <span className="block truncate text-xs text-ink-muted">{d.description}</span> : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-xs text-ink-muted">{d._count.cards} cards · ♥ {d._count.likes}</span>
                    {d.owner.role === "TEACHER" && d.owner.teacherVerifiedAt ? <Badge variant="success">Verified teacher</Badge> : null}
                    {d.owner.role === "ADMIN" ? <Badge variant="accent">EduSarthi</Badge> : null}
                  </span>
                </div>
                {d.tags.length ? <div className="mt-2 flex flex-wrap gap-1">{d.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div> : null}
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
