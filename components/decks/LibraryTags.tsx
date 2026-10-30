// Owns the row of topic chips on the library list: "All topics", then the
// topics in use with their deck counts, the most used first. Choosing one
// filters the list; the chosen one is marked. Topics beyond the first eight
// fold under a native <details>. That keeps the row short on a phone, where a
// dozen chips took five lines and pushed the first deck below the screen, and
// needs no JavaScript.
//
// It deliberately does NOT count or query anything: lib/libraryTags does, and
// passes the result in. A chip keeps the visitor's search and sort but not the
// page, because page 3 of one topic means nothing in another.

import Link from "next/link";

import type { LibraryTag } from "@/lib/libraryTags";
import { libraryHref } from "@/lib/libraryUrl";
import { cn } from "@/lib/utils";

const SHOWN = 8;

const BASE = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px]";
const ON = "bg-accent font-medium text-on-accent";
const OFF = "border border-border-strong text-ink hover:bg-hover";

export function LibraryTags({ tags, active, q, sort }: { tags: LibraryTag[]; active: string; q: string; sort: string }) {
  if (tags.length === 0) return null;
  const shown = tags.slice(0, SHOWN);
  const more = tags.slice(SHOWN);

  const chip = (t: LibraryTag) => (
    <li key={t.tag}>
      <Link href={libraryHref({ q, tag: t.tag, sort })} aria-current={t.tag === active ? "true" : undefined} className={cn(BASE, t.tag === active ? ON : OFF)}>
        {t.tag}
        <span className="font-mono text-xs">{t.count}</span>
      </Link>
    </li>
  );

  return (
    <nav aria-label="Topics" className="mt-3">
      <ul className="flex flex-wrap gap-1.5">
        <li>
          <Link href={libraryHref({ q, sort })} aria-current={active ? undefined : "true"} className={cn(BASE, active ? OFF : ON)}>
            All topics
          </Link>
        </li>
        {shown.map(chip)}
      </ul>
      {more.length > 0 ? (
        // Open when the chosen topic is one of the folded ones, so the visitor
        // can see what they picked.
        <details className="mt-1.5" open={more.some((t) => t.tag === active)}>
          <summary className="inline-flex min-h-8 cursor-pointer items-center text-[13px] font-medium text-accent-dark">More topics ({more.length})</summary>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">{more.map(chip)}</ul>
        </details>
      ) : null}
    </nav>
  );
}
