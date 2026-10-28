// Owns the strip above a card while a "Study this list" session is running:
// which list, how many cards come after this one, and End.
//
// It deliberately replaces the Flashcard tab's top bar (and a deck's due / new
// counts) only for the session: those count the tab or the deck, not the list,
// and showing both would leave the student unsure which they are going through.
// A server component: it only links.

import Link from "next/link";

import { CARD_LISTS } from "@/lib/cardLists";
import type { ListSession } from "@/lib/listSession";

export function ListSessionBar({ s }: { s: ListSession }) {
  const l = CARD_LISTS.find((x) => x.value === s.list)!;
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/12 px-3 py-1.5 text-sm">
      <p className="min-w-0 truncate text-ink">
        <span aria-hidden="true">{l.icon}</span> Studying <b>{l.label}</b> ·{" "}
        <span className="text-ink-muted">{s.left === 0 ? "last card" : `${s.left} more after this`}</span>
      </p>
      <Link href={`/my-cards?list=${s.list}`} className="shrink-0 font-medium text-accent hover:underline">
        End
      </Link>
    </div>
  );
}
