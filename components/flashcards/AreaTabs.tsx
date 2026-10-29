// Owns layer 1 of the study filters: the main study areas as tabs with an
// underline — English (the built-in Words, Chunk, Grammar and Support cards on
// the Flashcard tab) and My decks. Shown on top of both pages, so moving
// between them keeps the tabs in the same place. The page may put a short
// read-out at the row's right end (the Flashcard tab puts today's count there).
//
// It deliberately lists only areas that work today. Tech comes after the
// Library chat is merged, and playlists are a later database change
// (docs/FLASHCARD-NAV-LAYERS.md); an empty tab would promise what is not there.
// Links, not role="tablist": each area is its own page with its own URL.
// A server component: it only links.

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const STUDY_AREAS = [
  { value: "english", label: "English", href: "/flashcards" },
  { value: "decks", label: "My decks", href: "/decks" },
] as const;
export type StudyArea = (typeof STUDY_AREAS)[number]["value"];

export function AreaTabs({ current, aside }: { current: StudyArea; aside?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-border">
      <nav aria-label="Study area" className="flex shrink-0 gap-1">
        {STUDY_AREAS.map((a) => (
          <Link
            key={a.value}
            href={a.href}
            aria-current={a.value === current ? "page" : undefined}
            className={cn(
              // -mb-px puts the underline on top of the row's own border.
              "-mb-px flex min-h-8 items-center border-b-2 px-2.5 font-display text-sm font-bold",
              a.value === current ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {a.label}
          </Link>
        ))}
      </nav>
      {aside ? <div className="ml-auto min-w-0">{aside}</div> : null}
    </div>
  );
}
