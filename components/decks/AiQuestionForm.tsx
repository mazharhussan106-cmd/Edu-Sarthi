// Owns the questions the AI asks before it makes cards: each one as tap-able
// choices (pick one or several), a number, or a short text, with the person's
// last answer already selected.
//
// It deliberately holds no answers of its own; the panel passes them in, so
// "Back" and "Make cards" both see exactly what is on screen.

"use client";

import { useId } from "react";

import { Input, Label } from "@/components/ui/Input";
import { MAX_CARDS_PER_REQUEST } from "@/lib/aiCardSchemas";
import type { Question } from "@/lib/aiCards";
import { cn } from "@/lib/utils";

export type Answers = Record<string, string[]>;

function Chip({ on, label, onClick, disabled }: { on: boolean; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full border px-3 text-sm transition-colors disabled:opacity-60",
        on ? "border-accent bg-accent text-on-accent" : "border-border-strong bg-surface text-ink hover:bg-hover",
      )}
    >
      {label}
    </button>
  );
}

export function AiQuestionForm({ questions, answers, onAnswer, disabled }: { questions: Question[]; answers: Answers; onAnswer: (id: string, values: string[]) => void; disabled: boolean }) {
  const uid = useId();
  return (
    <div className="flex flex-col gap-4">
      {questions.map((q) => {
        const chosen = answers[q.id] ?? [];
        if (q.type === "choice" || q.type === "multi") {
          return (
            <fieldset key={q.id}>
              <legend className="text-sm font-medium text-ink">{q.text}</legend>
              {q.type === "multi" ? <p className="text-xs text-ink-muted">Pick as many as you like.</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <Chip
                    key={o}
                    label={o}
                    on={chosen.includes(o)}
                    disabled={disabled}
                    onClick={() => onAnswer(q.id, q.type === "multi" ? (chosen.includes(o) ? chosen.filter((c) => c !== o) : [...chosen, o]) : [o])}
                  />
                ))}
              </div>
            </fieldset>
          );
        }
        return (
          <div key={q.id}>
            <Label htmlFor={`${uid}-${q.id}`} className="text-sm text-ink">{q.text}</Label>
            <Input
              id={`${uid}-${q.id}`}
              type={q.type === "number" ? "number" : "text"}
              inputMode={q.type === "number" ? "numeric" : undefined}
              min={q.type === "number" ? 1 : undefined}
              max={q.type === "number" ? MAX_CARDS_PER_REQUEST : undefined}
              maxLength={q.type === "text" ? 500 : undefined}
              value={chosen[0] ?? ""}
              disabled={disabled}
              onChange={(e) => onAnswer(q.id, e.target.value ? [e.target.value] : [])}
              className={q.type === "number" ? "w-24" : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
