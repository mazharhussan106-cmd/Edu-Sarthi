// Owns showing the cards the AI made as a book would: an index of chapters at
// the top, then each chapter with its cards. Every card can be ticked, edited
// or removed before anything is added to the deck.
//
// It deliberately does NOT save anything or call the AI. It edits the list the
// panel owns and reports every change back, so what is ticked here is exactly
// what "Add" sends.

"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CardMarkdown } from "@/components/decks/CardMarkdown";

export type Draft = { key: string; chapter: string; front: string; back: string; example: string; body: string; include: boolean };

function DraftCard({ d, onChange, onRemove }: { d: Draft; onChange: (patch: Partial<Draft>) => void; onRemove: () => void }) {
  const uid = useId();
  const [editing, setEditing] = useState(false);
  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={d.include}
          onChange={(e) => onChange({ include: e.target.checked })}
          aria-label={`Add the card ${d.front}`}
          className="mt-1 size-4 accent-[var(--color-accent)]"
        />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-2">
              <div>
                <Label htmlFor={`${uid}-f`}>Front</Label>
                <Input id={`${uid}-f`} value={d.front} maxLength={200} onChange={(e) => onChange({ front: e.target.value })} />
              </div>
              <div>
                <Label htmlFor={`${uid}-b`}>Back</Label>
                <Input id={`${uid}-b`} value={d.back} maxLength={500} onChange={(e) => onChange({ back: e.target.value })} />
              </div>
              <div>
                <Label htmlFor={`${uid}-e`}>Example</Label>
                <Input id={`${uid}-e`} value={d.example} maxLength={300} onChange={(e) => onChange({ example: e.target.value })} />
              </div>
              <div>
                <Label htmlFor={`${uid}-n`}>Extra notes</Label>
                <textarea id={`${uid}-n`} value={d.body} maxLength={2000} rows={4} onChange={(e) => onChange({ body: e.target.value })} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent" />
              </div>
            </div>
          ) : (
            <>
              <p className="font-medium text-ink">{d.front}</p>
              <p className="text-sm text-ink-muted">{d.back}</p>
              {d.example ? <p className="mt-1 text-xs text-ink-muted">e.g. {d.example}</p> : null}
              {d.body ? <div className="mt-2 flex flex-col gap-1 text-xs text-ink-muted"><CardMarkdown source={d.body} /></div> : null}
            </>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
          <Button size="sm" variant="outline" onClick={() => setEditing((e) => !e)}>{editing ? "Done" : "Edit"}</Button>
          <Button size="sm" variant="ghost" onClick={onRemove} aria-label={`Remove the card ${d.front}`}>Remove</Button>
        </div>
      </div>
    </li>
  );
}

export function AiDraftList({ drafts, onChange }: { drafts: Draft[]; onChange: (next: Draft[]) => void }) {
  // Chapters in the order the AI wrote them; cards stay in their own order.
  const chapters = [...new Set(drafts.map((d) => d.chapter))];
  const label = (c: string) => c || "Cards";

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Chapters" className="rounded-lg bg-paper-dim p-3">
        <p className="text-xs font-medium text-ink-muted">Index</p>
        <ol className="mt-1 list-decimal pl-5 text-sm">
          {chapters.map((c, i) => (
            <li key={c}>
              <a href={`#ai-chapter-${i}`} className="text-accent hover:underline">{label(c)}</a>
              <span className="text-ink-muted"> · {drafts.filter((d) => d.chapter === c).length} cards</span>
            </li>
          ))}
        </ol>
      </nav>
      {chapters.map((c, i) => (
        <section key={c} id={`ai-chapter-${i}`} aria-labelledby={`ai-chapter-h-${i}`} className="scroll-mt-20">
          <h4 id={`ai-chapter-h-${i}`} className="font-display text-sm font-bold text-ink">{i + 1}. {label(c)}</h4>
          <ul className="mt-2 flex flex-col gap-2">
            {drafts.filter((d) => d.chapter === c).map((d) => (
              <DraftCard
                key={d.key}
                d={d}
                onChange={(patch) => onChange(drafts.map((x) => (x.key === d.key ? { ...x, ...patch } : x)))}
                onRemove={() => onChange(drafts.filter((x) => x.key !== d.key))}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
