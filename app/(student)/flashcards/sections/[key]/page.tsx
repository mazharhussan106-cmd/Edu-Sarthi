// Owns one section's page: how far the student is through it, a button to
// study the whole section, and its packs of 50 words with progress in each.
//
// Pack numbers are stable: a pack is the next 50 words of the section in
// learning order, so "Pack 3" is the same words every visit. An unknown key is
// a 404 rather than an empty page.

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { packStats, sectionDef, sectionWhere, PACK_SIZE } from "@/lib/wordSections";

export const revalidate = 0;

const n = (x: number) => x.toLocaleString("en-IN");

export default async function SectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const def = sectionDef(key);
  const filter = def ? await sectionWhere(def.key) : null;
  if (!def || !filter) notFound();

  const session = await auth();
  const packs = await packStats(session!.user.id, filter);
  const total = packs.reduce((x, p) => x + p.total, 0);
  const known = packs.reduce((x, p) => x + p.known, 0);
  const study = `/flashcards?kind=words&sec=${def.key}`;

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <Link href="/flashcards/sections" className="text-sm font-medium text-accent hover:underline">← All sections</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{def.label}</h1>
      <p className="text-sm text-ink-muted">{def.hint}</p>
      <p className="mt-2 font-mono text-sm text-ink-muted">
        <b className="text-ink">{n(known)}</b> / {n(total)} words known · {packs.length} pack{packs.length === 1 ? "" : "s"} of up to {PACK_SIZE}
      </p>

      <form action="/flashcards" role="search" className="relative mt-4">
        <input type="hidden" name="kind" value="words" />
        <input type="hidden" name="sec" value={def.key} />
        <label htmlFor="sec-q" className="sr-only">Search in {def.label}</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" aria-hidden="true" />
        <input
          id="sec-q"
          name="q"
          type="search"
          maxLength={60}
          placeholder={`Search in ${def.label}`}
          className="h-10 w-full rounded-full border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
        />
      </form>

      <Link href={study} className="mt-3 inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-medium text-on-accent hover:bg-accent-dark">
        Study this section
      </Link>

      <ul className="mt-5 flex flex-col gap-2">
        {packs.map((p) => {
          const pct = p.total ? Math.round((p.known / p.total) * 100) : 0;
          return (
            <li key={p.n}>
              <Link href={`${study}&pack=${p.n}`} className="block">
                <Card className="p-3 hover:bg-hover">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-sm font-bold text-ink">Pack {p.n}</span>
                    <span className="font-mono text-xs text-ink-muted">words {p.from}–{p.to}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-dim" role="img" aria-label={`${p.known} of ${p.total} known`}>
                    <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    <b className="text-ink">{p.known}</b> / {p.total} known{pct === 100 ? " · done" : ""}
                  </p>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
