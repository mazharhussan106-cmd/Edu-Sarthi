// Owns the filters above a card on the Flashcard tab, in two layers:
//   row 1  the study area, English · My decks (AreaTabs), with today's count
//          at the right end
//   row 2  the card kind: Words · Chunk · Grammar · Support, then
//          "⏭ N skipped" while there are skipped cards, then the remark
//          lists ⭐ ❤️ ❓ 💯
//
// Two layers and no third, as the owner asked (docs/FLASHCARD-NAV-LAYERS.md):
// the chips for chunk types, Support channel and level, and word sections are
// gone from here. Links from elsewhere can still open a filtered session
// (Explore opens one chunk type, a word section opens its own words), so the
// open kind's chip names the filter ("Chunk · Frames") and tapping it shows
// the whole kind again; a filter is never on without the student seeing it.
//
// Row 2 scrolls sideways; on a narrow phone the lists sit past the edge, under
// a fade. Links to other pages (Explore, Library, Institute) live in the ☰
// menu, not here: a row of filters should filter, not take the student
// somewhere else. Search is in the header (HeaderSearch). A server component:
// it only links, it never fetches.

import Link from "next/link";

import { AreaTabs } from "@/components/flashcards/AreaTabs";
import { DeckCount, DeckLists, type Counts, type ListKey } from "@/components/flashcards/DeckLists";
import { FADE_ROW } from "@/components/flashcards/fadeRow";
import { chunkTypeLabel } from "@/lib/chunkCard";
import { channelLabel, levelLabel } from "@/lib/supportCard";
import { cn } from "@/lib/utils";

export { DECK_LISTS, type ListKey } from "@/components/flashcards/DeckLists";

export const DECK_KINDS = [
  { value: "words", label: "Words", kind: "WORD", ready: true, noun: "word" },
  { value: "chunks", label: "Chunk", kind: "CHUNK", ready: true, noun: "chunk" },
  { value: "grammar", label: "Grammar", kind: "GRAMMAR", ready: true, noun: "card" },
  { value: "support", label: "Support", kind: "SUPPORT", ready: true, noun: "support sentence" },
] as const;
export type DeckKind = (typeof DECK_KINDS)[number];

const chip = "shrink-0 rounded-full border px-3 py-1 text-[13px] font-medium";
const divider = <span aria-hidden="true" className="mx-0.5 h-4 w-px shrink-0 bg-border-strong" />;

export function DeckTopBar({
  k,
  type,
  section,
  channel = null,
  level = null,
  list,
  base,
  skipCount,
  skipHref,
  counts,
}: {
  k: DeckKind;
  type: string | null;
  /** The word section being studied, if any, so it can be named on the chip. */
  section?: { label: string; key: string } | null;
  /** Support tab only: the channel and level filters, as in the URL. */
  channel?: string | null;
  level?: string | null;
  list: ListKey | undefined;
  base: string;
  skipCount: number;
  skipHref: string;
  counts: Counts | null;
}) {
  // What narrows the open kind, as the student would say it. Empty when the
  // whole kind is showing.
  const filter =
    k.value === "words"
      ? section?.label ?? ""
      : k.value === "chunks"
        ? type
          ? chunkTypeLabel(type)
          : ""
        : k.value === "support"
          ? [channel && channelLabel(channel), level && levelLabel(level)].filter(Boolean).join(" · ")
          : "";

  return (
    <>
      <AreaTabs current="english" aside={counts ? <DeckCount counts={counts} /> : null} />

      <div className={cn("mt-1 flex items-center gap-1.5 overflow-x-auto", FADE_ROW)}>
        <nav aria-label="Card kind" className="flex shrink-0 gap-1.5">
          {DECK_KINDS.map((x) => {
            const on = x.value === k.value;
            const named = on && filter;
            return (
              <Link
                key={x.value}
                href={`/flashcards?kind=${x.value}`}
                aria-current={on ? "page" : undefined}
                // The visible words stay at the start of the name (WCAG 2.5.3).
                aria-label={named ? `${x.label} · ${filter}. Show all ${x.noun}s` : undefined}
                className={cn(chip, on ? "border-accent bg-accent text-on-accent" : "border-border-strong text-ink hover:bg-hover")}
              >
                {x.label}
                {named ? <span className="font-normal"> · {filter}</span> : null}
                {!x.ready ? <span className="ml-1 text-[10px] opacity-70">soon</span> : null}
              </Link>
            );
          })}
        </nav>

        {skipCount ? (
          <>
            {divider}
            {/* 3px, not py-1: with its 1px border this is the same 24px as
                the list chips beside it. */}
            <Link href={skipHref} className="shrink-0 rounded-full border border-saffron px-2 py-[3px] text-xs font-medium text-ink hover:bg-hover">
              ⏭ {skipCount} skipped · show again
            </Link>
          </>
        ) : null}

        {counts ? (
          <>
            {divider}
            <DeckLists counts={counts} noun={k.noun} list={list} base={base} />
          </>
        ) : null}
      </div>
    </>
  );
}
