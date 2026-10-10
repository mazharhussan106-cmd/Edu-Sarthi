// Owns the Explore page: one place to see every kind of flashcard available,
// import a library deck, study it, and — where a verified teacher made the
// deck — record yourself for that teacher's audit.
//
// It deliberately does NOT copy anything itself or show whole decks. Import is
// one tap on a deck row; reading a deck's cards happens on its own page, so
// this list stays light on a slow phone.
//
// Honest about audits: only decks by a verified teacher can send a recording
// to that teacher. Other decks are for studying, and the page says so.

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { CopyDeckButton } from "@/components/decks/CopyDeckButton";
import { chunkTypeLabel } from "@/lib/chunkCard";
import { builtInCounts, librarySubjects } from "@/lib/explore";

export const revalidate = 0;

const n = (x: number) => x.toLocaleString("en-IN");
// A plain slug, because a percent-encoded id does not match its own #fragment.
const slug = (s: string) => `s-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export default async function ExplorePage() {
  const [built, subjects] = await Promise.all([builtInCounts(), librarySubjects()]);

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <h1 className="font-display text-2xl font-bold text-ink">Explore flashcards</h1>
      <p className="mt-1 text-sm text-ink-muted">
        See what is available, import a deck to study it, and send a recording for a teacher’s audit where a deck allows it.
      </p>

      <section aria-labelledby="builtin" className="mt-6">
        <h2 id="builtin" className="font-display text-lg font-bold text-ink">Built into EduSarthi</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
          {[
            { href: "/flashcards?kind=words", title: "Words", count: built.words, note: "Meaning, examples, usage" },
            { href: "/flashcards?kind=chunks", title: "Chunks", count: built.chunks, note: "Phrases you can say as one piece" },
            { href: "/flashcards?kind=grammar", title: "Grammar", count: built.grammar, note: "Patterns with examples" },
          ].map((c) => (
            <li key={c.title}>
              <Link href={c.href} className="block h-full">
                <Card className="h-full p-3 hover:bg-hover">
                  <p className="font-display text-base font-bold text-ink">{c.title}</p>
                  <p className="font-mono text-xl font-bold text-accent">{n(c.count)}</p>
                  <p className="text-xs text-ink-muted">{c.note}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
        {built.chunkTypes.length ? (
          <p className="mt-2 flex flex-wrap gap-1.5 text-xs text-ink-muted">
            Chunk types:
            {built.chunkTypes.map((t) => (
              <Link key={t.type} href={`/flashcards?kind=chunks&type=${t.type}`}>
                <Badge>{chunkTypeLabel(t.type)} · {n(t.count)}</Badge>
              </Link>
            ))}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="library" className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="library" className="font-display text-lg font-bold text-ink">Library decks by subject</h2>
          <Link href="/library" className="text-sm font-medium text-accent hover:underline">All decks</Link>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Checked by an admin before they appear. <b>Import</b> makes your own private copy and opens it to study. A deck marked
          <b> Teacher audit</b> lets you record yourself and get scores back in Audited.
        </p>

        {subjects.length === 0 ? (
          <Card className="mt-3 text-center text-sm text-ink-muted">
            No library decks are published yet. Make one in <Link href="/decks" className="font-medium text-accent hover:underline">My decks</Link> and submit it.
          </Card>
        ) : (
          <>
            <nav aria-label="Subjects" className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {subjects.map((s) => (
                <a key={s.name} href={`#${slug(s.name)}`} className="shrink-0 rounded-full border border-border-strong px-3 py-1 text-[13px] text-ink hover:bg-hover">
                  {s.name} <span className="font-mono text-xs text-ink-muted">{s.total}</span>
                </a>
              ))}
            </nav>

            {subjects.map((s) => (
              <div key={s.name} id={slug(s.name)} className="mt-5 scroll-mt-20">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-base font-bold capitalize text-ink">{s.name}</h3>
                  {s.name !== "More decks" ? (
                    <Link href={`/library?tag=${encodeURIComponent(s.name)}`} className="text-xs font-medium text-accent hover:underline">See all {s.total}</Link>
                  ) : null}
                </div>
                <ul className="mt-2 flex flex-col gap-2">
                  {s.decks.map((d) => (
                    <li key={d.id}>
                      <Card className="p-3">
                        <Link href={`/library/${d.id}`} className="block">
                          <span className="block truncate font-medium text-ink">{d.title}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                            <span className="font-mono">{n(d.cards)} cards</span>
                            {d.teacherVerified ? <Badge variant="success">Teacher audit</Badge> : null}
                            {d.official ? <Badge variant="accent">EduSarthi</Badge> : null}
                          </span>
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <CopyDeckButton deckId={d.id} signedIn size="sm" label="Import and study" then="study" />
                          <Link href={`/library/${d.id}`} className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover">
                            {d.teacherVerified ? "Preview and record" : "Preview"}
                          </Link>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>

      <Card className="mt-8">
        <CardTitle>Your own and your institute’s</CardTitle>
        <p className="mt-2 text-sm text-ink-muted">Decks you made, and decks your institute shares with its members, are kept apart from the public library.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/decks" className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover">My decks</Link>
          <Link href="/institute" className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover">Institute</Link>
        </div>
      </Card>
    </main>
  );
}
