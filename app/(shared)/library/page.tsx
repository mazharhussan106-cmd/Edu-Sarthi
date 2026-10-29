// Owns the public library: decks an admin has approved, with search, a topic
// filter, a sort and pages. Open to everyone, signed in or not (proxy.ts
// PUBLIC_LIBRARY); a visitor gets a sign-in prompt where an account is needed.
//
// Only listed decks are queried (lib/decks LISTED) — a deck waiting for review,
// rejected, pulled after reports, or whose owner or institute is suspended is
// simply not here. Each deck shows its creator as they chose to be credited
// (an institute's deck its name and logo first), and its licence
// (components/decks/DeckCredit).
// It deliberately does NOT list the viewer's own drafts (that is My decks).

import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { auth } from "@/lib/auth";
import { canonical } from "@/lib/siteUrl";
import { prisma } from "@/lib/prisma";
import { CREDIT_INSTITUTE_SELECT, CREDIT_SELECT } from "@/lib/libraryTerms";
import { libraryHref } from "@/lib/libraryUrl";
import { libraryTags } from "@/lib/libraryTags";
import { DeckCredit } from "@/components/decks/DeckCredit";
import { LISTED, aiCardCounts } from "@/lib/decks";
import { AiBadge } from "@/components/decks/AiBadge";
import { LibraryTags } from "@/components/decks/LibraryTags";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const revalidate = 0;

const PER_PAGE = 24;

type View = { q?: string; tag?: string; sort?: string; page?: string };

// One address in search results: the plain first page. A search, a topic,
// another sort and page 2 or later are the same decks again, so those stay out
// of the index (but their links are still followed). A topic page would be
// worth indexing only once topics have descriptions; not now.
export async function generateMetadata({ searchParams }: { searchParams: Promise<View> }): Promise<Metadata> {
  const sp = await searchParams;
  const variant = Boolean(sp.q?.trim() || sp.tag?.trim() || (sp.sort && sp.sort !== "new") || Number(sp.page) > 1);
  return {
    title: "Flashcard library — EduSarthi",
    description: "Flashcard decks shared by EduSarthi learners and teachers, checked by an admin before they appear. Anyone can read them.",
    ...canonical("/library"),
    ...(variant ? { robots: { index: false, follow: true } } : {}),
  };
}

const SORTS = [
  { value: "new", label: "Newest" },
  { value: "liked", label: "Most liked" },
  { value: "copied", label: "Most copied" },
] as const;

export default async function LibraryPage({ searchParams }: { searchParams: Promise<View> }) {
  const [sp, session] = await Promise.all([searchParams, auth()]);
  const signedIn = Boolean(session?.user?.id);
  const q = (sp.q ?? "").trim().slice(0, 60);
  const tag = (sp.tag ?? "").trim().toLowerCase().slice(0, 24);
  const sort = SORTS.some((x) => x.value === sp.sort) ? (sp.sort as string) : "new";
  const filtered = Boolean(q || tag);

  const where: Prisma.DeckWhereInput = {
    ...LISTED,
    ...(tag ? { tags: { has: tag } } : {}),
    ...(q
      ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { tags: { has: q.toLowerCase() } }] }
      : {}),
  };
  // Newest is the tiebreak, and the id the last one: without it two decks with
  // the same time or count could swap places between page 1 and page 2, so one
  // would show twice and another not at all.
  const orderBy: Prisma.DeckOrderByWithRelationInput[] =
    sort === "liked"
      ? [{ likes: { _count: "desc" } }, { reviewedAt: "desc" }, { id: "asc" }]
      : sort === "copied"
        ? [{ copyCount: "desc" }, { reviewedAt: "desc" }, { id: "asc" }]
        : [{ reviewedAt: "desc" }, { id: "asc" }];

  const [total, topics] = await Promise.all([prisma.deck.count({ where }), libraryTags()]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  // A page number that is not a number, or past the end, shows the nearest real one.
  const page = Math.min(pages, Math.max(1, Math.floor(Number(sp.page)) || 1));

  const decks = await prisma.deck.findMany({
    where,
    orderBy,
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
    select: { id: true, title: true, description: true, tags: true, licence: true, ...CREDIT_INSTITUTE_SELECT, owner: { select: { ...CREDIT_SELECT, teacherVerifiedAt: true } }, _count: { select: { cards: true, likes: true } } },
  });

  const aiCards = await aiCardCounts(decks.map((d) => d.id));

  return (
    <main className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-ink">Flashcard library</h1>
        {signedIn ? <Link href="/decks" className="text-sm font-medium text-accent hover:underline">My decks</Link> : null}
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Flashcard decks shared by learners and teachers, checked by an admin before they appear.{" "}
        {signedIn ? "Copy one to study it." : <>Anyone can read them. <Link href="/login" className="text-accent underline">Sign in</Link> to copy or follow one.</>}
      </p>

      <form action="/library" className="relative mt-3">
        <label htmlFor="lib-search" className="sr-only">Search the library</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" aria-hidden="true" />
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        <input type="hidden" name="sort" value={sort} />
        <input id="lib-search" name="q" type="search" defaultValue={q} placeholder="Search decks or topics" className="h-9 w-full rounded-full border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent" />
      </form>
      <nav aria-label="Sort decks" className="mt-2 flex gap-1.5">
        {SORTS.map((x) => (
          <Link
            key={x.value}
            href={libraryHref({ q, tag, sort: x.value })}
            aria-current={x.value === sort ? "page" : undefined}
            className={x.value === sort ? "rounded-full bg-accent px-3 py-1 text-[13px] font-medium text-on-accent" : "rounded-full border border-border-strong px-3 py-1 text-[13px] text-ink hover:bg-hover"}
          >
            {x.label}
          </Link>
        ))}
      </nav>
      <LibraryTags tags={topics} active={tag} q={q} sort={sort} />

      {total > 0 ? (
        <p className="mt-3 text-sm text-ink-muted">
          {total} {total === 1 ? "deck" : "decks"}{filtered ? (total === 1 ? " matches" : " match") : ""}
        </p>
      ) : null}

      <ul className="mt-2 flex flex-col gap-2">
        {decks.length === 0 ? (
          <li>
            <Card className="text-center text-sm text-ink-muted">
              {filtered ? (
                <>No deck matches that. Try a shorter word, or <Link href="/library" className="text-accent underline">see every deck</Link>.</>
              ) : signedIn ? (
                "No decks are published yet. Make one in My decks and submit it."
              ) : (
                "No decks are published yet. Please check again soon."
              )}
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
                    <DeckCredit owner={d.owner} institute={d.institute} licence={d.licence} className="mt-0.5 truncate" />
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-xs text-ink-muted">{d._count.cards} cards · ♥ {d._count.likes}</span>
                    {d.owner.role === "TEACHER" && d.owner.teacherVerifiedAt ? <Badge variant="success">Verified teacher</Badge> : null}
                    {d.owner.role === "ADMIN" ? <Badge variant="accent">EduSarthi</Badge> : null}
                    {aiCards.get(d.id) ? <AiBadge label="Has AI-assisted cards" /> : null}
                  </span>
                </div>
                {d.tags.length ? <div className="mt-2 flex flex-wrap gap-1">{d.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div> : null}
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={libraryHref({ q, tag, sort, page: page - 1 })} rel="prev" className="font-medium text-accent hover:underline">← Previous</Link> : <span />}
          <span className="font-mono text-xs text-ink-muted">{page} / {pages}</span>
          {page < pages ? <Link href={libraryHref({ q, tag, sort, page: page + 1 })} rel="next" className="font-medium text-accent hover:underline">Next →</Link> : <span />}
        </nav>
      ) : null}
    </main>
  );
}
