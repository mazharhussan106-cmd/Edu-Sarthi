// Owns the top of the Flashcard tab: one scrolling row with the card kinds
// (Words, Chunk, Grammar, Support), the "skipped" chip, the student's remark
// lists and today's counts; on the Chunk tab, a second row with the chunk
// types (Frames, Prepositions, …), and on the Support tab a second row with
// the channels (Voice, Chat, Email) and levels.
//
// Search moved to the header (HeaderSearch). Kept to as few short rows as possible so the card gets most of a phone
// screen. A server component: it only links, it never fetches.

import Link from "next/link";

import { CHUNK_TYPES } from "@/lib/chunkCard";
import { SUPPORT_CHANNELS, SUPPORT_LEVELS } from "@/lib/supportCard";
import { cn } from "@/lib/utils";

export const DECK_KINDS = [
  { value: "words", label: "Words", kind: "WORD", ready: true, noun: "word" },
  { value: "chunks", label: "Chunk", kind: "CHUNK", ready: true, noun: "chunk" },
  { value: "grammar", label: "Grammar", kind: "GRAMMAR", ready: true, noun: "card" },
  { value: "support", label: "Support", kind: "SUPPORT", ready: true, noun: "support sentence" },
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
const subChip = "shrink-0 rounded-full px-2.5 py-0.5 text-xs";
const subOn = "bg-tag-navy font-medium text-surface";
const subOff = "bg-paper-dim text-ink-muted hover:text-ink";

/// The Support tab's link for a channel and level. Tapping the chip that is
/// already on turns that filter off, so "all levels" needs no extra chip.
function supportHref(channel: string | null, level: string | null): string {
  return `/flashcards?kind=support${channel ? `&ch=${channel}` : ""}${level ? `&lv=${level}` : ""}`;
}

export function DeckTopBar({
  k,
  type,
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
  /** Support tab only: the channel and level filters, as in the URL. */
  channel?: string | null;
  level?: string | null;
  list: ListKey | undefined;
  base: string;
  skipCount: number;
  skipHref: string;
  counts: Counts | null;
}) {
  return (
    <>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
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
          { href: "/explore", label: "🧭 Explore" },
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
                subChip,
                type === t.value ? subOn : subOff,
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {k.value === "support" ? (
        <div className="mt-1 flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
          <nav aria-label="Support channel" className="flex shrink-0 gap-1">
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
          <span aria-hidden="true" className="mx-0.5 h-4 w-px shrink-0 bg-border-strong" />
          <nav aria-label="Support level" className="flex shrink-0 gap-1">
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
        </div>
      ) : null}
    </>
  );
}
