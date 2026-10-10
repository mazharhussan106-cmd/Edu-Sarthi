// Owns the flashcard search box that sits in the header, right after the
// EduSarthi name, so the flashcard page itself gives that row back to the card.
//
// It is a plain GET form to /flashcards, the same URL the page already reads
// (`q`, `kind`, `type`), so search needs no new route or client fetching. It
// deliberately does NOT search anything itself and does not live on the page:
// the header is on every student page, so search works from the dashboard too.

"use client";

import { Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

export function HeaderSearch() {
  const params = useSearchParams();
  const onCards = usePathname() === "/flashcards";

  // Keep the student on the card kind (and chunk type) they are browsing;
  // from any other page start at Words, the default tab.
  const kind = onCards ? params.get("kind") : null;
  const type = onCards ? params.get("type") : null;
  const q = onCards ? (params.get("q") ?? "") : "";

  return (
    <form action="/flashcards" role="search" className="relative min-w-0 flex-1 sm:max-w-xs">
      {kind ? <input type="hidden" name="kind" value={kind} /> : null}
      {type ? <input type="hidden" name="type" value={type} /> : null}
      <label htmlFor="header-search" className="sr-only">Search cards by word or ID</label>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" aria-hidden="true" />
      {/* key={q}: defaultValue is read once, so without it a new search from
          another page would leave the old text in the box. */}
      <input
        key={q}
        id="header-search"
        name="q"
        type="search"
        defaultValue={q}
        maxLength={60}
        placeholder="Search word or ID"
        className="h-9 w-full rounded-full border border-border-strong bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
      />
    </form>
  );
}
