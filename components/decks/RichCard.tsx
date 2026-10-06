// Owns one imported 56-point card on screen: three tabs — Recognition,
// Understanding, Practice — so a phone shows one side at a time instead of a
// 50-field wall. Starts on Recognition, which never gives the answer.
//
// It reports tab changes upward so the study screen can offer its "how well
// did you know it" buttons once the learner has looked at side 2 or 3. It
// deliberately renders the sides but does not own their content (RichSides).

"use client";

import { useState } from "react";

import { Side1, Side2, Side3 } from "@/components/decks/RichSides";
import { cn } from "@/lib/utils";

const TABS = [
  { n: 1, label: "Recognise" },
  { n: 2, label: "Understand" },
  { n: 3, label: "Practise" },
] as const;

export function RichCard({ rich, onSide }: { rich: Record<string, string>; onSide?: (n: 1 | 2 | 3) => void }) {
  const [side, setSide] = useState<1 | 2 | 3>(1);
  const go = (n: 1 | 2 | 3) => {
    setSide(n);
    onSide?.(n);
  };
  return (
    <div>
      <div role="tablist" aria-label="Card sides" className="grid grid-cols-3 gap-1 rounded-lg bg-paper-dim p-1">
        {TABS.map((t) => (
          <button
            key={t.n}
            role="tab"
            type="button"
            id={`rc-tab-${t.n}`}
            aria-selected={side === t.n}
            aria-controls="rc-panel"
            onClick={() => go(t.n)}
            className={cn("h-9 rounded-md text-sm font-medium", side === t.n ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink")}
          >
            {t.n}. {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="rc-panel" aria-labelledby={`rc-tab-${side}`} className="mt-4">
        {side === 1 ? <Side1 f={rich} /> : side === 2 ? <Side2 f={rich} /> : <Side3 f={rich} />}
      </div>
    </div>
  );
}
