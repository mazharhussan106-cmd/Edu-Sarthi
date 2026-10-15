// Owns the three practice pieces only support cards need: put the words in
// order (tap the jumbled words to build the sentence), a "tap to see a model
// answer" reveal, and the yes/no self-check before recording.
//
// Like PracticeParts, nothing here is scored or saved: it is self-practice,
// checked in the browser against the sheet's own answer. It deliberately
// holds no card data of its own.

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { sameAnswer } from "@/lib/wordCard";

/// `words` arrive already jumbled from the sheet ("hold / you / …"), so the
/// order is the same on every visit and needs no shuffling here.
export function Reorder({ words, answer }: { words: string[]; answer: string }) {
  const [picked, setPicked] = useState<number[]>([]);
  const [shown, setShown] = useState(false);
  const built = picked.map((i) => words[i]).join(" ");
  const done = picked.length === words.length;
  const right = done && sameAnswer(built, answer);

  return (
    <div className="mt-2 flex flex-col gap-2">
      <p aria-live="polite" className="min-h-9 rounded-lg border border-dashed border-border-strong px-3 py-1.5 text-sm text-ink">
        {built || <span className="text-ink-muted">Tap the words below in order</span>}
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Words to put in order">
        {words.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            disabled={picked.includes(i)}
            onClick={() => setPicked((p) => [...p, i])}
            className="rounded-md border border-border-strong px-2 py-1 text-sm text-ink hover:bg-hover disabled:opacity-30"
          >
            {w}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => setPicked((p) => p.slice(0, -1))} disabled={!picked.length}>
          Undo
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setPicked([]); setShown(false); }} disabled={!picked.length && !shown}>
          Start again
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShown(true)}>
          Show answer
        </Button>
        {done ? (
          <span className={cn("text-xs font-medium", right ? "text-success" : "text-error")}>
            {right ? "Correct!" : "Not quite — tap Start again and try once more."}
          </span>
        ) : null}
      </div>
      {shown ? <p className="text-xs text-ink-muted">Answer: {answer}</p> : null}
    </div>
  );
}

export function Reveal({ label, answer }: { label: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div aria-live="polite">
      {open ? (
        <p className="mt-2 italic text-ink">“{answer}”</p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 rounded-lg border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-hover"
        >
          {label}
        </button>
      )}
    </div>
  );
}

export function SelfCheck({ items }: { items: string[] }) {
  const [ticked, setTicked] = useState<boolean[]>(() => items.map(() => false));
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {items.map((it, i) => (
        <li key={it}>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={ticked[i]}
              onChange={(e) => setTicked((t) => t.map((v, j) => (j === i ? e.target.checked : v)))}
              className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
            />
            <span>{it}</span>
          </label>
        </li>
      ))}
      {ticked.every(Boolean) ? <li className="text-xs font-medium text-success">All three done — you are ready to send it.</li> : null}
    </ul>
  );
}
