// Owns the address of a library list view: search, topic, sort and page in one
// place, so the sort chips, topic chips, pager and the search form cannot
// disagree about what the plain list looks like. It also owns reading those
// parts back safely from an address anyone may have typed or tampered with.
//
// It deliberately leaves out whatever is the default (sort "new", page 1), so
// the plain list is always exactly "/library" — the one address that is
// indexed and the canonical for every variant. It imports no Prisma, so a
// client component may use it.

export type LibraryView = { q?: string; tag?: string; sort?: string; page?: number };

/// One query-string value as plain text, whatever was sent. Next hands over an
/// array when a parameter is repeated (?q=a&q=b), and `.trim()` on that threw,
/// so the page did not load; the first value is what a person meant. Control
/// characters, NUL above all, become spaces: Postgres refuses a NUL in any text
/// it is asked to match, which also threw. Anyone can send either, now the
/// library is public.
export function queryText(value: string | string[] | undefined, max: number): string {
  const first = Array.isArray(value) ? value[0] : value;
  return (first ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

export const SORTS = [
  { value: "new", label: "Newest" },
  { value: "liked", label: "Most liked" },
  { value: "copied", label: "Most copied" },
] as const;

export type RawView = { q?: string | string[]; tag?: string | string[]; sort?: string | string[]; page?: string | string[] };

/// The list's search, topic, sort and page, read once for both the page and
/// its metadata so they can never disagree about which view this is. The page
/// number is not limited to the last page here: that needs the total.
export function readView(sp: RawView): { q: string; tag: string; sort: string; page: number } {
  const sort = queryText(sp.sort, 10);
  return {
    q: queryText(sp.q, 60),
    tag: queryText(sp.tag, 24).toLowerCase(),
    sort: SORTS.some((s) => s.value === sort) ? sort : "new",
    page: queryPage(sp.page),
  };
}

/// A page number from an address: a whole number from 1, whatever was sent.
export function queryPage(value: string | string[] | undefined): number {
  return Math.max(1, Math.floor(Number(queryText(value, 12))) || 1);
}

/// Whether a path segment can be a deck or card id at all (they are cuids).
/// Checked before asking the database, so a made-up segment such as a NUL byte
/// is simply "not found" and never reaches a query.
export function isRecordId(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

export function libraryHref(view: LibraryView): string {
  const qs = new URLSearchParams();
  if (view.q) qs.set("q", view.q);
  if (view.tag) qs.set("tag", view.tag);
  if (view.sort && view.sort !== "new") qs.set("sort", view.sort);
  if (view.page && view.page > 1) qs.set("page", String(view.page));
  const query = qs.toString();
  return query ? `/library?${query}` : "/library";
}
