// Owns the five rubric sliders and whether each has been deliberately set.
//
// A score counts only once the teacher has moved or confirmed it. Sliders
// still start in the middle so they are easy to grab, but an untouched one
// reads "not set" and blocks submission — five 5s sent without listening is
// the audit this platform most needs to prevent.

"use client";

import { Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export const CRITERIA = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "grammar", label: "Grammar" },
  { key: "fluency", label: "Fluency" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "confidence", label: "Confidence" },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];
export type Scores = Record<CriterionKey, number>;

export function ScorePanel({
  scores,
  touched,
  showMissing,
  onChange,
}: {
  scores: Scores;
  touched: ReadonlySet<CriterionKey>;
  showMissing: boolean;
  onChange: (key: CriterionKey, value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {CRITERIA.map((c) => {
        const set = touched.has(c.key);
        const missing = showMissing && !set;
        return (
          <div key={c.key}>
            <div className="flex items-center justify-between">
              <Label htmlFor={c.key} className={cn("mb-0", missing && "text-error")}>
                {c.label}
              </Label>
              <span className={cn("font-mono text-sm", set ? "text-ink" : "text-mist", missing && "text-error")}>
                {set ? `${scores[c.key]}/10` : "not set"}
              </span>
            </div>
            <input
              id={c.key}
              type="range"
              min={0}
              max={10}
              step={1}
              value={scores[c.key]}
              // Change, pointer-up and key-up all count: pressing the thumb without
              // moving it is how a teacher confirms that 5 really is a 5.
              onChange={(e) => onChange(c.key, Number(e.target.value))}
              onPointerUp={(e) => onChange(c.key, Number(e.currentTarget.value))}
              onKeyUp={(e) => onChange(c.key, Number(e.currentTarget.value))}
              aria-invalid={missing || undefined}
              aria-valuetext={set ? `${scores[c.key]} out of 10` : "not set"}
              className={cn(
                "mt-2 w-full accent-[var(--color-accent)]",
                !set && "opacity-50",
                missing && "rounded outline outline-1 outline-error",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
