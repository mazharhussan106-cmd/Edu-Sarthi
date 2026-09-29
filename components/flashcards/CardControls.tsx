// Owns the four controls under the flashcard, as in the design: Known,
// Unknown, Remark ▾ and Level ▾.
//
// Level (Hard / Medium / Easy) is chosen before pressing Known and decides
// how far the next review is pushed; Known alone counts as Medium. Remarks
// save the moment they are tapped and never move the card on.

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type Remarks = { confident: boolean; important: boolean; favourite: boolean; doubt: boolean };
export type Level = "HARD" | "MEDIUM" | "EASY";

const REMARKS: { key: keyof Remarks; label: string }[] = [
  { key: "confident", label: "💯 100% confident" },
  { key: "important", label: "⭐ Important" },
  { key: "favourite", label: "❤️ Favourite" },
  { key: "doubt", label: "❓ Doubt — ask teacher" },
];

const LEVELS: { value: Level; label: string; hint: string }[] = [
  { value: "HARD", label: "Hard", hint: "same gap again" },
  { value: "MEDIUM", label: "Medium", hint: "next step" },
  { value: "EASY", label: "Easy", hint: "skip a step" },
];

const pill = "flex h-11 min-w-0 items-center justify-center gap-1 rounded-full border px-2 text-sm font-medium";

export function CardControls({
  busy,
  level,
  onLevel,
  remarks,
  onRemark,
  note,
  onNote,
  onMark,
}: {
  busy: boolean;
  level: Level;
  onLevel: (l: Level) => void;
  remarks: Remarks;
  onRemark: (k: keyof Remarks, v: boolean) => void;
  note: string;
  onNote: (n: string) => void;
  onMark: (known: boolean) => void;
}) {
  const [open, setOpen] = useState<"remark" | "level" | null>(null);
  const [draft, setDraft] = useState(note);
  const anyRemark = Object.values(remarks).some(Boolean) || Boolean(note);

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-1.5">
        <button type="button" disabled={busy} onClick={() => onMark(true)} className={cn(pill, "border-success bg-success text-on-accent disabled:opacity-60")}>
          Known
        </button>
        <button type="button" disabled={busy} onClick={() => onMark(false)} className={cn(pill, "border-error text-error disabled:opacity-60")}>
          Unknown
        </button>
        <button
          type="button"
          aria-expanded={open === "remark"}
          onClick={() => setOpen(open === "remark" ? null : "remark")}
          className={cn(pill, "border-border-strong text-ink", anyRemark && "border-accent text-accent")}
        >
          Remark <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-expanded={open === "level"}
          onClick={() => setOpen(open === "level" ? null : "level")}
          className={cn(pill, "border-border-strong text-ink")}
        >
          {LEVELS.find((l) => l.value === level)?.label} <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {open === "remark" ? (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface-raised p-3 shadow-lg">
          <div className="flex flex-col gap-1">
            {REMARKS.map((r) => (
              <label key={r.key} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-hover">
                {r.label}
                <input
                  type="checkbox"
                  checked={remarks[r.key]}
                  onChange={(e) => onRemark(r.key, e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
              </label>
            ))}
          </div>
          <label htmlFor="card-note" className="mt-2 block px-2 text-xs font-medium text-ink-muted">
            📝 My note
          </label>
          <textarea
            id="card-note"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => draft !== note && onNote(draft)}
            placeholder="Anything to remember about this word"
            className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-mist"
          />
          <button type="button" onClick={() => { if (draft !== note) onNote(draft); setOpen(null); }} className="mt-1 w-full rounded-lg bg-paper-dim py-1.5 text-xs text-ink">
            Done
          </button>
        </div>
      ) : null}

      {open === "level" ? (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-56 rounded-xl border border-border bg-surface-raised p-2 shadow-lg" role="radiogroup" aria-label="How well do you know it">
          <p className="px-2 pb-1 text-xs text-ink-muted">How well do you know it?</p>
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              role="radio"
              aria-checked={level === l.value}
              onClick={() => {
                onLevel(l.value);
                setOpen(null);
              }}
              className={cn("flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm", level === l.value ? "bg-accent/12 text-accent" : "text-ink hover:bg-hover")}
            >
              {l.label}
              <span className="text-xs text-ink-muted">{l.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
