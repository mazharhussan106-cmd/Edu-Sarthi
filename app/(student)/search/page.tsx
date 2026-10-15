// Owns the search page the header's magnifier opens: a box, the card kind to
// search in, and the student's recent searches.
//
// The page itself is a thin server shell. Recent searches live in this
// browser (see SearchBox), so there is nothing to fetch or scope by user here.

import { SearchBox } from "@/components/flashcards/SearchBox";
import { sectionDef } from "@/lib/wordSections";

export const metadata = { title: "Search — EduSarthi" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ sec?: string }> }) {
  // /search?sec=level-a1 searches inside that section; an unknown key is ignored.
  const def = sectionDef((await searchParams).sec);
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Search</h1>
      <p className="mt-1 text-sm text-ink-muted">Find a word, chunk, grammar or support card by its text or its ID.</p>
      <SearchBox section={def ? { key: def.key, label: def.label } : null} />
    </main>
  );
}
