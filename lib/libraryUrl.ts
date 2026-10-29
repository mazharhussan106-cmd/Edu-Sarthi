// Owns the address of a library list view: search, topic, sort and page in one
// place, so the sort chips, topic chips, pager and the search form cannot
// disagree about what the plain list looks like.
//
// It deliberately leaves out whatever is the default (sort "new", page 1), so
// the plain list is always exactly "/library" — the one address that is
// indexed and the canonical for every variant. It imports no Prisma, so a
// client component may use it.

export type LibraryView = { q?: string; tag?: string; sort?: string; page?: number };

export function libraryHref(view: LibraryView): string {
  const qs = new URLSearchParams();
  if (view.q) qs.set("q", view.q);
  if (view.tag) qs.set("tag", view.tag);
  if (view.sort && view.sort !== "new") qs.set("sort", view.sort);
  if (view.page && view.page > 1) qs.set("page", String(view.page));
  const query = qs.toString();
  return query ? `/library?${query}` : "/library";
}
