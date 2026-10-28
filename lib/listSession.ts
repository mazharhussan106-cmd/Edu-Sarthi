// Owns where a "Study this list" session stands, carried in the URL: which
// list (?inlist=hard), which card of it is open (?sid=<CardState id>) and how
// many come after it (?left=3). The router page /my-cards/study picks each
// card and opens it on its own study page — the Flashcard tab for built-in
// cards, the deck's study page for deck cards — with these added, so every
// card keeps the one EduSarthi card and its Known / Unknown / Remark bar.
//
// The card pages only read this to send Known, Unknown, › and ‹ back to the
// router instead of to their own next card. Nothing here is trusted: the
// router re-checks every card against the person's own lists, and `left` is
// only a number shown on their own screen.
//
// No database or server imports, so pages and components share one parser.

import { CARD_LISTS, type CardListKey } from "@/lib/cardLists";

export type ListSession = { list: CardListKey; sid: string; left: number };

/// CardState ids are cuids: lower-case letters and digits.
export const STATE_ID = /^[a-z0-9]{10,40}$/;

export function parseListSession(sp: { inlist?: string; sid?: string; left?: string }): ListSession | null {
  const list = CARD_LISTS.find((l) => l.value === sp.inlist)?.value;
  if (!list || !sp.sid || !STATE_ID.test(sp.sid)) return null;
  const left = Math.min(10_000, Math.max(0, Math.floor(Number(sp.left)) || 0));
  return { list, sid: sp.sid, left };
}

/// Where a card in the session goes next. The card components add
/// `&skip=…` (›, ignored here: moving on is the point) or `&card=…` (‹, the
/// router opens that card) to it.
export function listNextHref(s: ListSession): string {
  return `/my-cards/study?list=${s.list}&after=${s.sid}`;
}

/// Added to a card's own study URL, which already has `?card=…`.
export function listParams(list: CardListKey, sid: string, left: number): string {
  return `&inlist=${list}&sid=${sid}&left=${left}`;
}
