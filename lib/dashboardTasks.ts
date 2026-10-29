// Owns the dashboard's "Today's tasks" list and the one-line summary under
// the greeting: which rows show, which are done, and where each one leads.
//
// It deliberately takes already-read numbers and does no database work, so
// the rules can be checked with plain data and the page has one place where
// its queries are visible (lib/dashboard).
//
// A row with nothing to do and nothing done today is left out rather than
// shown as an empty zero; a quiet day should look quiet, not broken.

import type { CardKind } from "@prisma/client";

import { DECK_KINDS } from "@/components/flashcards/DeckTopBar";
import type { DeckToday, KindToday } from "@/lib/todayReview";

export type TaskRow = {
  key: string;
  label: string;
  sub?: string;
  count?: number;
  href: string;
  done: boolean;
  /// A sent-back recording: the one row the student is asked to act on.
  urgent?: boolean;
};

export type RedoItem = { id: string; title: string };

const MAX_DECK_ROWS = 2;
const MAX_REDO_ROWS = 2;

/// "Words 9 · Chunk 5 · Grammar 4", only the kinds with any due.
export function dueSplit(kinds: ReadonlyMap<CardKind, KindToday>): string {
  return DECK_KINDS.map((k) => ({ label: k.label, due: kinds.get(k.kind)?.due ?? 0 }))
    .filter((k) => k.due > 0)
    .map((k) => `${k.label} ${k.due}`)
    .join(" · ");
}

export function todayTasks(input: {
  redo: readonly RedoItem[];
  kinds: ReadonlyMap<CardKind, KindToday>;
  decks: readonly DeckToday[];
  reviewsToday: number;
  /// Every recording sent today, replacements included (they earn XP too).
  recordedToday: number;
  /// Null for a guest, who cannot send recordings.
  audits: { perDay: number; left: number } | null;
  recordingHref: string;
}): TaskRow[] {
  const rows: TaskRow[] = input.redo.slice(0, MAX_REDO_ROWS).map((r) => ({
    key: `redo-${r.id}`,
    label: `Re-record “${r.title}”`,
    sub: "Your teacher sent it back with tips",
    href: `/feedback/${r.id}`,
    done: false,
    urgent: true,
  }));

  const due = [...input.kinds.values()].reduce((n, k) => n + k.due, 0);
  if (due > 0 || input.reviewsToday > 0) {
    rows.push({
      key: "due",
      label: due > 0 ? "Review due cards" : "Due cards reviewed",
      sub: due > 0 ? dueSplit(input.kinds) : undefined,
      count: due > 0 ? due : undefined,
      href: "/today",
      done: due === 0,
    });
  }

  for (const d of input.decks.slice(0, MAX_DECK_ROWS)) {
    rows.push({ key: `deck-${d.id}`, label: `Deck: ${d.title}`, sub: "Cards due", count: d.due, href: d.href, done: false });
  }
  if (input.decks.length > MAX_DECK_ROWS) {
    const more = input.decks.length - MAX_DECK_ROWS;
    rows.push({ key: "decks-more", label: `${more} more deck${more === 1 ? "" : "s"} with cards due`, href: "/today", done: false });
  }

  // Words only: it is the daily track the Flashcard tab opens on, and adding
  // every kind's allowance would promise forty "new cards" nobody intends.
  const words = input.kinds.get("WORD");
  if (words && (words.newLeft > 0 || words.newToday > 0)) {
    rows.push({
      key: "new",
      label: words.newLeft > 0 ? "Learn new words" : "New words learned",
      sub: words.newLeft > 0 ? `${words.newLeft} left today` : `${words.newToday} today`,
      count: words.newLeft > 0 ? words.newLeft : undefined,
      href: "/flashcards?kind=words",
      done: words.newLeft === 0,
    });
  }

  if (input.audits) {
    const sent = input.recordedToday;
    rows.push({
      key: "record",
      label: sent > 0 ? "Recording sent today" : "Send a recording for audit",
      sub: input.audits.left > 0 ? `${input.audits.left} left today · a teacher scores it` : "Today's limit reached",
      href: input.recordingHref,
      done: sent > 0,
    });
  } else {
    rows.push({
      key: "keep",
      label: "Keep your progress",
      sub: "Add your email so your streak and XP are not lost. Recordings and audits come with it.",
      href: "/settings",
      done: false,
    });
  }
  return rows;
}

/// The line under the greeting: what is left, and how far the ring has to go.
export function summaryLine(rows: readonly TaskRow[], todayXp: number, goal: number): string {
  const left = rows.filter((r) => !r.done).length;
  const things = left === 0 ? "Everything on today's list is done" : `${left} thing${left === 1 ? "" : "s"} left today`;
  const xp = todayXp >= goal ? "today's goal done" : `${goal - todayXp} XP to your goal`;
  return `${things} · ${xp}`;
}
