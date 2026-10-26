// Owns the index of chapters at the top of a deck whose cards are grouped into
// chapters: each chapter's name, how many cards it holds, and a link down to it.
// Used on the deck editor; the AI card maker's draft list builds its own from
// unsaved drafts.
//
// It deliberately renders only links. Grouping the cards and drawing the
// headings the links point at is the page's job.

export type ChapterEntry = { anchor: string; title: string; count: number };

export function ChapterIndex({ chapters }: { chapters: ChapterEntry[] }) {
  return (
    <nav aria-label="Chapters" className="rounded-lg bg-paper-dim p-3">
      <p className="text-xs font-medium text-ink-muted">Index</p>
      <ol className="mt-1 list-decimal pl-5 text-sm">
        {chapters.map((c) => (
          <li key={c.anchor}>
            <a href={`#${c.anchor}`} className="text-accent hover:underline">{c.title}</a>
            <span className="text-ink-muted"> · {c.count} card{c.count === 1 ? "" : "s"}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
