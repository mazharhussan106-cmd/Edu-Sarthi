// Owns the flashcard summary on the dashboard and Progress page: known and not
// yet known, doubts, and the topics that need the most revisiting.
//
// It deliberately says "not yet known", not "failed". A card marked unknown is
// simply scheduled to come back sooner.

import Link from "next/link";

import type { CardProgressData } from "@/lib/studentStats";

export function CardProgress({ data }: { data: CardProgressData }) {
  if (data.seen === 0) {
    return (
      <p className="text-sm text-ink-muted">
        You have not answered a card yet. <Link href="/flashcards" className="font-medium text-accent hover:underline">Start with a few</Link> and this fills in.
      </p>
    );
  }
  const pct = Math.round((data.known / data.seen) * 100);
  return (
    <div>
      <div className="flex items-baseline gap-4">
        <p><span className="font-mono text-2xl font-bold text-ink">{data.known}</span> <span className="text-xs text-ink-muted">known</span></p>
        <p><span className="font-mono text-2xl font-bold text-ink">{data.unknown}</span> <span className="text-xs text-ink-muted">not yet</span></p>
        <p><span className="font-mono text-2xl font-bold text-ink">{data.doubt}</span> <span className="text-xs text-ink-muted">doubts</span></p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-dim" role="img" aria-label={`${pct} percent of the cards you have answered are known`}>
        <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
      </div>
      {data.weakTopics.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-ink">Revisit these first</p>
          <ul className="mt-1 text-sm text-ink-muted">
            {data.weakTopics.map((t) => (
              <li key={t.name}>{t.name} · {t.count} card{t.count === 1 ? "" : "s"}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
