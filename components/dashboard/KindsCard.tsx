// Owns the Flashcards card on the student dashboard: known, still learning
// and doubts, how much of each kind of built-in card is known, and the topic
// most worth revisiting.
//
// It deliberately counts built-in cards only (lib/studentStats), so a
// student's own decks cannot make "known" look bigger than the course is.

import Link from "next/link";
import { ChevronRight, RotateCcw } from "lucide-react";

import { Card, CardTitle } from "@/components/ui/Card";
import type { CardProgressData, KindKnown } from "@/lib/studentStats";

// One colour per kind, all theme tokens, so the four bars can be told apart
// beside their labels (the labels carry the meaning; colour only helps).
const BAR: Record<string, string> = { WORD: "bg-accent", CHUNK: "bg-tag-teal", GRAMMAR: "bg-tag-navy", SUPPORT: "bg-saffron" };

export function KindsCard({ data, kinds }: { data: CardProgressData; kinds: readonly KindKnown[] }) {
  const weak = data.weakTopics[0];
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>Flashcards</CardTitle>
        <Link href="/my-cards?list=unknown" className="text-sm font-semibold text-accent-dark hover:underline">My card lists</Link>
      </div>
      {data.seen === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">
          You have not answered a card yet. <Link href="/flashcards" className="font-medium text-accent-dark hover:underline">Start with a few</Link> and this fills in.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              [data.known, "known"],
              [data.unknown, "learning"],
              [data.doubt, "doubts"],
            ].map(([n, label]) => (
              <p key={label} className="text-xs text-ink-muted">
                <b className="block font-mono text-2xl font-bold text-ink">{n}</b>
                {label}
              </p>
            ))}
          </div>
          <ul className="mt-3 flex flex-col gap-1">
            {kinds.map((k) => (
              <li key={k.kind} className="grid min-h-7 grid-cols-[4.5rem_1fr_6rem] items-center gap-2.5 text-sm">
                <span className="text-ink">{k.label}</span>
                <span className="block h-2 overflow-hidden rounded-full bg-paper-dim" aria-hidden="true">
                  <span className={`block h-full rounded-full ${BAR[k.kind]}`} style={{ width: `${Math.max(k.known > 0 ? 2 : 0, (k.known / k.total) * 100)}%` }} />
                </span>
                <span className="text-right font-mono text-xs text-ink-muted">
                  {k.known.toLocaleString("en-IN")} / {k.total.toLocaleString("en-IN")}
                  <span className="sr-only"> known</span>
                </span>
              </li>
            ))}
          </ul>
          {weak ? (
            <Link href="/my-cards?list=unknown" className="mt-3 flex min-h-11 items-center gap-2.5 rounded-lg bg-paper-dim px-3 text-sm text-ink hover:bg-hover">
              <RotateCcw aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-muted" />
              <span className="min-w-0 flex-1">Revisit first: <b>{weak.name}</b> · {weak.count} card{weak.count === 1 ? "" : "s"}</span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-muted" />
            </Link>
          ) : null}
        </>
      )}
    </Card>
  );
}
