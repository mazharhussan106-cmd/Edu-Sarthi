// Owns the one control line under the card, as the owner specified:
//   ‹  Known  Unknown  [Remark ▾]  ›
// ‹ and › move between cards without answering. Remark ▾ opens a small panel
// with the five remarks (💯 ⭐ ❤️ ❓ 📝) as one-tap toggles and the level
// (Hard / Medium / Easy). The card's colour is chosen in Settings.
//
// Level is chosen before pressing Known and decides how far the next review
// is pushed; Known alone counts as Medium. Remarks save the moment they are
// tapped and never move the card on. Zoom is not here on purpose: it is
// fingers only, on the card itself.

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type Remarks = { confident: boolean; important: boolean; favourite: boolean; doubt: boolean };
export type Level = "HARD" | "MEDIUM" | "EASY";

const REMARKS: { key: keyof Remarks; icon: string; label: string }[] = [
  { key: "confident", icon: "💯", label: "100% confident" },
  { key: "important", icon: "⭐", label: "Important" },
  { key: "favourite", icon: "❤️", label: "Favourite" },
  { key: "doubt", icon: "❓", label: "Doubt — ask teacher" },
];

const LEVELS: { value: Level; label: string }[] = [
  { value: "HARD", label: "Hard" },
  { value: "MEDIUM", label: "Medium" },
  { value: "EASY", label: "Easy" },
];

const box = "flex h-12 items-center justify-center whitespace-nowrap rounded-xl border font-display text-[13px] font-bold disabled:opacity-60";

export function CardControls({
  busy,
  level,
  onLevel,
  remarks,
  onRemark,
  note,
  onNote,
  onMark,
  onPrev,
  onNext,
}: {
  busy: boolean;
  level: Level;
  onLevel: (l: Level) => void;
  remarks: Remarks;
  onRemark: (k: keyof Remarks, v: boolean) => void;
  note: string;
  onNote: (n: string) => void;
  onMark: (known: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState(note);
  const wrap = useRef<HTMLDivElement>(null);
  const count = Object.values(remarks).filter(Boolean).length + (note ? 1 : 0);

  // Closes on a tap outside or Escape, like any menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <div className="grid grid-cols-[2.5rem_1fr_1fr_auto_2.5rem] gap-1.5">
        <button type="button" onClick={onPrev} aria-label="Previous card" className={cn(box, "border-border-strong bg-surface text-ink hover:bg-hover")}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" disabled={busy} onClick={() => onMark(true)} className={cn(box, "border-success bg-success text-on-accent")}>
          Known
        </button>
        <button type="button" disabled={busy} onClick={() => onMark(false)} className={cn(box, "border-error bg-surface text-error")}>
          Unknown
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="card-remark-panel"
          onClick={() => setOpen((o) => !o)}
          className={cn(box, "gap-0.5 bg-surface px-2 text-ink hover:bg-hover", open || count ? "border-accent" : "border-border-strong")}
        >
          Remark
          {count ? <span className="rounded-full bg-accent px-1.5 text-[10px] text-on-accent">{count}</span> : null}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
        <button type="button" onClick={onNext} aria-label="Next card" className={cn(box, "border-border-strong bg-surface text-ink hover:bg-hover")}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div
          id="card-remark-panel"
          className="absolute bottom-full right-0 z-30 mb-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface-raised p-3 shadow-lg"
        >
          <p className="font-display text-xs font-bold text-ink-muted">Remark</p>
          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
            {REMARKS.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={remarks[r.key]}
                aria-label={r.label}
                title={r.label}
                onClick={() => onRemark(r.key, !remarks[r.key])}
                className={cn(
                  "grid h-11 place-items-center rounded-xl border text-lg",
                  remarks[r.key] ? "border-saffron bg-saffron/15" : "border-border hover:bg-hover",
                )}
              >
                {r.icon}
              </button>
            ))}
            <button
              type="button"
              aria-expanded={noteOpen}
              aria-label="My note"
              title="My note"
              onClick={() => setNoteOpen((o) => !o)}
              className={cn("grid h-11 place-items-center rounded-xl border text-lg", note ? "border-saffron bg-saffron/15" : "border-border hover:bg-hover")}
            >
              📝
            </button>
          </div>

          {noteOpen ? (
            <div className="mt-2">
              <label htmlFor="card-note" className="text-xs font-medium text-ink-muted">My note</label>
              <textarea
                id="card-note"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Anything to remember about this word"
                className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-mist focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                disabled={draft === note}
                onClick={() => onNote(draft)}
                className="mt-1 w-full rounded-lg bg-accent py-2 text-xs font-medium text-on-accent disabled:opacity-50"
              >
                Save note
              </button>
            </div>
          ) : null}

          <p className="mt-3 font-display text-xs font-bold text-ink-muted">Level — how well you know it</p>
          <div role="radiogroup" aria-label="Level" className="mt-1.5 grid grid-cols-3 overflow-hidden rounded-xl border border-border-strong">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={level === l.value}
                onClick={() => onLevel(l.value)}
                className={cn("h-10 text-sm font-medium", level === l.value ? "bg-accent text-on-accent" : "text-ink hover:bg-hover")}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-muted">Used when you press Known: Easy skips ahead, Hard repeats the same gap.</p>
        </div>
      ) : null}
    </div>
  );
}
