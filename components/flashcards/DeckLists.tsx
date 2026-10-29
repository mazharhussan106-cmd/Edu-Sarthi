// Owns the two small read-outs in the Flashcard tab's filters: today's count
// (due · new · known), which sits at the right of the study-area tabs, and the
// student's remark lists (⭐ ❤️ ❓ 💯) for the open tab, which close the
// filter row.
//
// The count used to sit at the far end of one long sideways row, off a phone
// screen. Beside the tabs it is always in view and costs no extra row; the
// card keeps the height. It deliberately holds no filters (DeckTopBar owns
// those) and fetches nothing: server components that only link.

import Link from "next/link";

import { cn } from "@/lib/utils";

export const DECK_LISTS = [
  { value: "important", label: "⭐ Important" },
  { value: "favourite", label: "❤️ Favourite" },
  { value: "doubt", label: "❓ Doubt" },
  { value: "confident", label: "💯 Confident" },
] as const;
export type ListKey = (typeof DECK_LISTS)[number]["value"];

export type Counts = { due: number; newLeft: number; known: number; total: number; lists: Record<ListKey, number> };

export function DeckCount({ counts }: { counts: Counts }) {
  // On a 360px phone with four-digit totals the count can need a second line.
  // Each part stays whole and the text keeps to the right edge, so "known"
  // drops under the rest instead of breaking off its number; two short lines
  // fit the tabs' height, so the card loses nothing.
  return (
    <p className="text-right text-xs leading-tight text-ink-muted">
      <span className="whitespace-nowrap">
        <b className="font-mono text-ink">{counts.due}</b> due ·
      </span>{" "}
      <span className="whitespace-nowrap">
        <b className="font-mono text-ink">{counts.newLeft}</b> new ·
      </span>{" "}
      <span className="whitespace-nowrap">
        <b className="font-mono text-ink">{counts.known}</b>/{counts.total} known
      </span>
    </p>
  );
}

export function DeckLists({
  counts,
  noun,
  list,
  base,
}: {
  counts: Counts;
  /** What one card of the open tab is called, for the lists' screen-reader names. */
  noun: string;
  list: ListKey | undefined;
  base: string;
}) {
  return (
    <nav aria-label="My lists" className="flex shrink-0 gap-1">
      {DECK_LISTS.map((l) => (
        <Link
          key={l.value}
          href={list === l.value ? base : `${base}&list=${l.value}`}
          aria-current={list === l.value ? "page" : undefined}
          aria-label={`${l.label} list, ${counts.lists[l.value]} ${noun}s`}
          className={cn(
            "shrink-0 rounded-full px-2 py-1 text-xs",
            list === l.value ? "bg-accent/12 font-medium text-accent" : "bg-paper-dim text-ink-muted hover:text-ink",
          )}
        >
          {l.label.split(" ")[0]} <span className="font-mono">{counts.lists[l.value]}</span>
        </Link>
      ))}
    </nav>
  );
}
