// Owns the filters above a card on the Flashcard tab, in layers:
//   row 1  the study area, English · My decks (AreaTabs), with today's count
//          at the right end
//   row 2  the card kind: Words · Chunk · Grammar · Support
//   row 3  the open kind's own filters, as before (word sections on Words,
//          chunk types on Chunk, channel and level on Support; none on
//          Grammar), then "⏭ N skipped" while there are skipped cards, then
//          the remark lists ⭐ ❤️ ❓ 💯
//
// Each row is short and scrolls sideways on its own, so a narrow phone hides
// the end of one row instead of everything after the card kinds. Three rows,
// not four: the count shares the tabs' row so the card loses as little height
// as possible. Links to other pages (Explore, Library, Institute) live in the
// ☰ menu, not here: a row of filters should filter, not take the student
// somewhere else.
//
// Search is in the header (HeaderSearch). A server component: it only links,
// it never fetches.

import Link from "next/link";

import { AreaTabs } from "@/components/flashcards/AreaTabs";
import { DeckCount, DeckLists, type Counts, type ListKey } from "@/components/flashcards/DeckLists";
import { FADE_ROW } from "@/components/flashcards/fadeRow";
import { CHUNK_TYPES } from "@/lib/chunkCard";
import { SUPPORT_CHANNELS, SUPPORT_LEVELS } from "@/lib/supportCard";
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
// py-1 makes these 24px tall, the WCAG 2.2 minimum for a tap target; they
// were 20px before.
const subChip = "shrink-0 rounded-full px-2.5 py-1 text-xs";
const subOn = "bg-tag-navy font-medium text-surface";
const subOff = "bg-paper-dim text-ink-muted hover:text-ink";
const group = "flex shrink-0 gap-1";
const divider = <span aria-hidden="true" className="mx-0.5 h-4 w-px shrink-0 bg-border-strong" />;

/// The Support tab's link for a channel and level. Tapping the chip that is
/// already on turns that filter off, so "all levels" needs no extra chip.
function supportHref(channel: string | null, level: string | null): string {
  return `/flashcards?kind=support${channel ? `&ch=${channel}` : ""}${level ? `&lv=${level}` : ""}`;
}

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
  /** The word section being studied, if any, so it can be shown and left. */
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
  const hasFilters = k.value === "words" || k.value === "chunks" || k.value === "support";
  return (
    <>
      <AreaTabs current="english" aside={counts ? <DeckCount counts={counts} /> : null} />

      <nav aria-label="Card kind" className={cn("mt-1 flex gap-1.5 overflow-x-auto", FADE_ROW)}>
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

      {hasFilters || skipCount || counts ? (
        <div className={cn("flex items-center gap-1 overflow-x-auto", FADE_ROW)}>
          {k.value === "words" ? (
            <div className={group}>
              <Link href="/flashcards/sections" className={cn(subChip, section ? subOn : subOff)}>
                {section ? `📂 ${section.label}` : "📂 Sections"}
              </Link>
              {section ? (
                <Link href={`/search?sec=${section.key}`} aria-label={`Search in ${section.label}`} className={cn(subChip, subOff)}>
                  🔍 Search here
                </Link>
              ) : null}
              {section ? (
                <Link href="/flashcards?kind=words" aria-label="Study all words again" className={cn(subChip, subOff)}>
                  ✕ All words
                </Link>
              ) : null}
            </div>
          ) : null}

          {k.value === "chunks" ? (
            <nav aria-label="Chunk type" className={group}>
              {[{ value: null, label: "All" }, ...CHUNK_TYPES].map((t) => (
                <Link
                  key={t.value ?? "all"}
                  href={t.value ? `/flashcards?kind=chunks&type=${t.value}` : "/flashcards?kind=chunks"}
                  aria-current={type === t.value ? "page" : undefined}
                  className={cn(subChip, type === t.value ? subOn : subOff)}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          ) : null}

          {k.value === "support" ? (
            <>
              <nav aria-label="Support channel" className={group}>
                {SUPPORT_CHANNELS.map((c) => (
                  <Link
                    key={c.value}
                    href={supportHref(channel === c.value ? null : c.value, level)}
                    aria-current={channel === c.value ? "page" : undefined}
                    className={cn(subChip, channel === c.value ? subOn : subOff)}
                  >
                    {c.label}
                  </Link>
                ))}
              </nav>
              {divider}
              <nav aria-label="Support level" className={group}>
                {SUPPORT_LEVELS.map((l) => (
                  <Link
                    key={l.value}
                    href={supportHref(channel, level === l.value ? null : l.value)}
                    aria-current={level === l.value ? "page" : undefined}
                    className={cn(subChip, level === l.value ? subOn : subOff)}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </>
          ) : null}

          {skipCount ? (
            <>
              {hasFilters ? divider : null}
              {/* 3px, not py-1: with its 1px border this is the same 24px as
                  the chips beside it, so the row (and the card) does not
                  jump when the first card is skipped. */}
              <Link href={skipHref} className="shrink-0 rounded-full border border-saffron px-2 py-[3px] text-xs font-medium text-ink hover:bg-hover">
                ⏭ {skipCount} skipped · show again
              </Link>
            </>
          ) : null}

          {counts ? (
            <>
              {hasFilters || skipCount ? divider : null}
              <DeckLists counts={counts} noun={k.noun} list={list} base={base} />
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
