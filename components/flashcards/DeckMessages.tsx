// Owns what the Flashcard tab shows instead of a card: search results and
// remark lists, the "done for today" card, and the "coming soon" card for a
// kind with no content yet. Server components; the page does the fetching.

import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { NEW_PER_DAY } from "@/lib/srs";

export type ResultRow = { code: string; text: string; gloss: string; meta: string };

export function DeckResults({
  rows,
  q,
  noun,
  hrefFor,
}: {
  rows: ResultRow[];
  q: string;
  noun: string;
  hrefFor: (code: string) => string;
}) {
  return (
    <div className="mt-4">
      <p className="text-sm text-ink-muted">
        {rows.length === 0
          ? q
            ? `No ${noun} matches “${q}”. Try a shorter part of it, or its ID.`
            : "Nothing in this list yet. Use Remark on a card to add it here."
          : `${rows.length} ${noun}${rows.length === 1 ? "" : "s"}`}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((w) => (
          <li key={w.code}>
            <Link href={hrefFor(w.code)} className="block">
              <Card className="flex items-center justify-between gap-3 p-3 hover:bg-hover">
                <span className="min-w-0">
                  <span className="block font-display font-bold text-ink">{w.text}</span>
                  <span className="block truncate text-xs text-ink-muted">{w.gloss}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-mist">{w.meta}</span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeckDone({
  skipCount,
  allSeen,
  noun,
  skipHref,
  moreHref,
}: {
  skipCount: number;
  allSeen: boolean;
  noun: string;
  skipHref: string;
  moreHref: string;
}) {
  return (
    <Card className="mt-4 text-center">
      <p className="font-display text-lg font-bold text-ink">
        {skipCount ? "No more cards except the ones you skipped" : allSeen ? "You have seen every card" : "Done for today"}
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {skipCount
          ? `You skipped ${skipCount} card${skipCount === 1 ? "" : "s"} with ›. Go through them now, or come back later.`
          : `No reviews are due and today’s ${NEW_PER_DAY} new ${noun}s are done. Coming back tomorrow is what makes them stick.`}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {skipCount ? (
          <Link href={skipHref} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
            Show skipped cards again
          </Link>
        ) : null}
        <Link href={moreHref} className="inline-flex h-10 items-center rounded-lg border border-border-strong px-4 text-sm text-ink hover:bg-hover">
          Learn more new {noun}s anyway
        </Link>
      </div>
    </Card>
  );
}

export function ComingSoon({ label }: { label: string }) {
  return (
    <Card className="mt-4 text-center">
      <p className="font-display text-lg font-bold text-ink">{label} cards are coming</p>
      <p className="mt-1 text-sm text-ink-muted">The content is being prepared. Words and chunks are ready to practise now.</p>
      <Link href="/flashcards?kind=words" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
        Practise words
      </Link>
    </Card>
  );
}
