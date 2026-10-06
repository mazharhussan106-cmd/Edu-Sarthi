// Owns what a page shows while its server data loads: a few grey blocks where
// the content will land, inside the normal header and footer.
//
// Not a spinner and not a blocking overlay — on a slow phone the shell stays
// usable and the layout does not jump when the page arrives. It deliberately
// knows nothing about any page; one shape serves every route group.

export function RouteLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className="mx-auto max-w-2xl px-3 pb-6 pt-4 sm:px-6 sm:pt-8">
      <span className="sr-only">Loading…</span>
      <div className="h-7 w-1/2 animate-pulse rounded-lg bg-paper-dim" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-paper-dim" />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-paper-dim" />
        ))}
      </div>
    </main>
  );
}
