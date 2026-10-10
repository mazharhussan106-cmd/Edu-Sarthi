// Owns the search button in the header: a magnifier at the right, beside
// settings and the menu, that opens the search page.
//
// It is a plain link, not an input. A text box in the header took a third of a
// phone's width and shrank to "Search w"; the page it opens (app/(student)/
// search) has room for the box, the card kind and the student's recent
// searches. It deliberately holds no state and does no searching itself.

import Link from "next/link";
import { Search } from "lucide-react";

export function HeaderSearch() {
  return (
    <Link
      href="/search"
      aria-label="Search cards"
      className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-hover"
    >
      <Search className="h-5 w-5" aria-hidden="true" />
    </Link>
  );
}
