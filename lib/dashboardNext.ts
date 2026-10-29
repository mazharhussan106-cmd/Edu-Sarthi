// Owns the single "do this next" choice on the student dashboard: the one
// thing most worth doing, in priority order — a sent-back recording, then a
// brand-new student's first words, then cards due (every kind and deck), then
// new words, then the next untried exercise.
//
// It takes the already-fetched data rather than querying, so the dashboard
// keeps one place where its database work is visible (lib/dashboard).

import type { CardKind } from "@prisma/client";

import { DECK_KINDS } from "@/components/flashcards/DeckTopBar";
import { dueSplit, type RedoItem } from "@/lib/dashboardTasks";
import type { DeckToday, KindToday } from "@/lib/todayReview";

export type NextAction = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

/// About twenty seconds a review and thirty a new card, said as "about": a
/// promise of a time is only useful if it is roughly right, and it is never
/// exact.
function minutes(cards: number, secondsEach = 20): string {
  const m = Math.max(1, Math.round((cards * secondsEach) / 60));
  return `About ${m} minute${m === 1 ? "" : "s"}.`;
}

export function nextAction({
  redo,
  kinds,
  decks,
  firstDay,
  member,
  nextExercise,
}: {
  redo: readonly RedoItem[];
  kinds: ReadonlyMap<CardKind, KindToday>;
  decks: readonly DeckToday[];
  /// No card answered and nothing sent yet.
  firstDay: boolean;
  member: boolean;
  nextExercise: { id: string; title: string; module: { level: number } } | null;
}): NextAction {
  if (redo.length > 0) {
    return {
      eyebrow: "Action needed",
      title: `Re-record “${redo[0].title}”`,
      body: "Your teacher sent this back. The reason and tips are on the next screen.",
      href: `/feedback/${redo[0].id}`,
      cta: "Open it",
    };
  }

  const words = kinds.get("WORD");
  if (firstDay && words && words.newLeft > 0) {
    const n = Math.min(10, words.newLeft);
    return {
      eyebrow: "Start here",
      title: `Learn your first ${n} words`,
      body: `${minutes(n, 30)} Each card has the meaning, examples and a way to say it.`,
      href: "/flashcards?kind=words",
      cta: "Start",
    };
  }

  // The kind with the most cards due goes first; the split tells the student
  // what else is waiting.
  const byDue = DECK_KINDS.map((k) => ({ ...k, due: kinds.get(k.kind)?.due ?? 0 })).sort((a, b) => b.due - a.due);
  const due = byDue.reduce((n, k) => n + k.due, 0);
  if (due > 0) {
    return {
      eyebrow: "Do this next · Flashcards",
      title: `Review ${due} card${due === 1 ? "" : "s"}`,
      body: `${dueSplit(kinds)}. ${minutes(due)} Reviewing on time is what makes them stick.`,
      href: `/flashcards?kind=${byDue[0].value}`,
      cta: "Start review",
    };
  }

  if (decks.length > 0) {
    const d = decks[0];
    return {
      eyebrow: "Do this next · Your deck",
      title: `Review ${d.due} card${d.due === 1 ? "" : "s"} in ${d.title}`,
      body: minutes(d.due),
      href: d.href,
      cta: "Start review",
    };
  }

  if (words && words.newLeft > 0) {
    return {
      eyebrow: "Do this next · Flashcards",
      title: `Learn ${words.newLeft} new word${words.newLeft === 1 ? "" : "s"}`,
      body: `Nothing is due. ${minutes(words.newLeft, 30)}`,
      href: "/flashcards?kind=words",
      cta: "Learn new words",
    };
  }

  if (!member) {
    return {
      eyebrow: "Keep going",
      title: "Explore more cards",
      body: "Chunks, grammar, support English and subject decks are all free to study.",
      href: "/explore",
      cta: "Explore",
    };
  }

  return nextExercise
    ? {
        eyebrow: `Next up · Level ${nextExercise.module.level}`,
        title: nextExercise.title,
        body: "A speaking exercise you have not tried yet. A teacher scores your recording.",
        href: `/practice/${nextExercise.id}`,
        cta: "Start",
      }
    : {
        eyebrow: "Keep going",
        title: "Practise again",
        body: "You have tried every exercise. Repeat one and compare the audits.",
        href: "/modules",
        cta: "Choose one",
      };
}
