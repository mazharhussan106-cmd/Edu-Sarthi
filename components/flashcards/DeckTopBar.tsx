// Owns the top of the Flashcard tab: the search box, then one scrolling row
// with the card kinds (Words, Chunk, Grammar), the "skipped" chip, the
// student's remark lists and today's counts; on the Chunk tab, a second row
// with the chunk types (Frames, Prepositions, …).
//
// Kept to as few short rows as possible so the card gets most of a phone
// screen. A server component: it only links, it never fetches.

import Link from "next/link";
import { Search } from "lucide-react";

import { CHUNK_TYPES } from "@/lib/chunkCard";
import { cn } from "@/lib/utils";

export const DECK_KINDS = [
  { value: "words", label: "Words", kind: "WORD", ready: true, noun: "word" },
  { value: "chunks", label: "Chunk", kind: "CHUNK", ready: true, noun: "chunk" },
  { value: "grammar", label: "Grammar", kind: "GRAMMAR", ready: true, noun: "card" },
] as const;
export type DeckKind = (typeof DECK_KINDS)[number];

export const DECK_LISTS = [
  { value: "important", label: "⭐ Important" },
  { value: "favourite", label: "❤️ Favourite" },
  { value: "doubt", label: "❓ Doubt" },
  { value: "confident", label: "💯 Confident" },
] as const;
export type ListKey = (typeof DECK_LISTS)[number]["value"];

type Counts = { due: number; newLeft: number; known: number; total: number; lists: Record<ListKey, number> };

const chip = "shrink-0 rounded-full border px-3 py-1 text-[13px] font-medium";

export function DeckTopBar({
  k,
  type,
  q,
  list,
  base,
  skipCount,
  skipHref,
  counts,
}: {
  k: DeckKind;
  type: string | null;
  q: string;
  list: ListKey | undefined;
  base: string;
  skipCount: number;
  skipHref: string;
  counts: Counts | null;
}) {
  return (
    <>
      <form action="/flashcards" className="relative">
        <input type="hidden" name="kind" value={k.value} />
        {type ? <input type="hidden" name="type" value={type} /> : null}
        <label htmlFor="card-search" className="sr-only">Search {k.noun}s</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" aria-hidden="true" />
        <input
          id="card-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={`Search a ${k.noun} or ID`}
          className="h-9 w-full rounded-full border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-mist focus:border-accent focus:outline-none"
        />
      </form>

      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        <nav aria-label="Card kind" className="flex shrink-0 gap-1.5">
          {DECK_KINDS.map((x) => (
            <Link
              key={x.value}
              href={`/flashcards?kind=${x.value}`}
              aria-current={x.value === k.value ? "page" : undefined}
              className={cn(chip, x.value === k.value ? "border-accent bg-accent text-on-accent" : "border-border-strong text-ink hover:bg-hover")}
            >
              {x.label}
              {!x.ready ? <span className="ml-1 text-[10px] opacity-70">soon</span> : null}
            </Link>
          ))}
        </nav>
        {/* After the card kinds and before the lists, where the owner placed
            it. On a narrow phone the row scrolls sideways to reach it. */}
        {/* Deck library: the student's own decks, the public library and the
            institute. Placed after the card kinds, before the lists. */}
        {[
          { href: "/decks", label: "📚 My decks" },
          { href: "/library", label: "🌐 Library" },
          { href: "/institute", label: "🏫 Institute" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 rounded-full border border-border-strong px-3 py-1 text-[13px] font-medium text-ink hover:bg-hover">
            {l.label}
          </Link>
        ))}
        {skipCount ? (
          <Link href={skipHref} className="shrink-0 rounded-full border border-saffron px-2 py-1 text-xs font-medium text-ink hover:bg-hover">
            ⏭ {skipCount} skipped · show again
          </Link>
        ) : null}
        {counts ? (
          <>
            <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-border-strong" />
            <nav aria-label="My lists" className="flex shrink-0 gap-1">
              {DECK_LISTS.map((l) => (
                <Link
                  key={l.value}
                  href={list === l.value ? base : `${base}&list=${l.value}`}
                  aria-current={list === l.value ? "page" : undefined}
                  aria-label={`${l.label} list, ${counts.lists[l.value]} ${k.noun}s`}
                  className={cn(
                    "shrink-0 rounded-full px-2 py-1 text-xs",
                    list === l.value ? "bg-accent/12 font-medium text-accent" : "bg-paper-dim text-ink-muted hover:text-ink",
                  )}
                >
                  {l.label.split(" ")[0]} <span className="font-mono">{counts.lists[l.value]}</span>
                </Link>
              ))}
            </nav>
            <p className="ml-1 shrink-0 text-xs text-ink-muted">
              <b className="font-mono text-ink">{counts.due}</b> due · <b className="font-mono text-ink">{counts.newLeft}</b> new ·{" "}
              <b className="font-mono text-ink">{counts.known}</b>/{counts.total} known
            </p>
          </>
        ) : null}
      </div>

      {k.value === "chunks" ? (
        <nav aria-label="Chunk type" className="mt-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
          {[{ value: null, label: "All" }, ...CHUNK_TYPES].map((t) => (
            <Link
              key={t.value ?? "all"}
              href={t.value ? `/flashcards?kind=chunks&type=${t.value}` : "/flashcards?kind=chunks"}
              aria-current={type === t.value ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs",
                type === t.value ? "bg-tag-navy font-medium text-surface" : "bg-paper-dim text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
