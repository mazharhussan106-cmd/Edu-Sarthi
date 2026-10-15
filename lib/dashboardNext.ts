// Owns the single "do this next" choice on the student dashboard: the one
// thing most worth doing, in priority order — a sent-back recording first,
// then flashcards that are due, then the next untried exercise.
//
// It takes the already-fetched data rather than querying, so the dashboard
// keeps one place where its database work is visible.

import type { NextAction } from "@/components/student/TodayStrip";

export function nextAction({
  toRedo,
  cards,
  nextExercise,
}: {
  toRedo: { id: string; exercise: { title: string } } | null;
  cards: { due: number; newLeft: number };
  nextExercise: { id: string; title: string; module: { level: number } } | null;
}): NextAction {
  return toRedo
      ? {
          eyebrow: "Action needed",
          title: `Re-record “${toRedo.exercise.title}”`,
          body: "Your teacher sent this back. The reason and tips are on the next screen.",
          href: `/feedback/${toRedo.id}`,
          cta: "Open it",
        }
      : cards.due > 0 || cards.newLeft > 0
        ? {
            eyebrow: "Flashcards",
            title: cards.due > 0 ? `Review ${cards.due} word${cards.due === 1 ? "" : "s"}` : `Learn ${cards.newLeft} new words`,
            body: cards.due > 0 ? "These are due today. Reviewing on time is what makes them stick." : "Today's new words are waiting.",
            href: "/flashcards",
            cta: "Open flashcards",
          }
      : nextExercise
        ? {
            eyebrow: `Next up · Level ${nextExercise.module.level}`,
            title: nextExercise.title,
            body: "A new exercise you have not tried yet.",
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
