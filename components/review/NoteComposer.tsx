// Owns the note-writing half of the audit workstation: the list of notes
// (each time seeks the player) and the composer for the next one.
//
// It holds no state. RubricForm owns the notes so they save into the same
// draft as the scores and summary.

"use client";

import type { RefObject } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { NoteList } from "@/components/review/NoteList";
import type { NoteInput } from "@/lib/validations";

function fmt(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

export function NoteComposer({
  notes,
  onSeek,
  onRemove,
  draft,
  onDraft,
  draftAt,
  onDraftAt,
  severity,
  onSeverity,
  onAdd,
  durationSec,
  noteRef,
}: {
  notes: readonly NoteInput[];
  onSeek: (at: number) => void;
  onRemove: (index: number) => void;
  draft: string;
  onDraft: (v: string) => void;
  draftAt: number;
  onDraftAt: (v: number) => void;
  severity: "minor" | "major";
  onSeverity: (v: "minor" | "major") => void;
  onAdd: () => void;
  durationSec: number | null;
  noteRef: RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <Card>
      <CardTitle>Timestamped notes</CardTitle>
      <p className="mt-1 text-xs text-ink-muted">
        At least one — it tells the student where the problem was.
      </p>
      <div className="mt-4">
        <NoteList notes={notes} onSeek={onSeek} onRemove={onRemove} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
        <div>
          <Label htmlFor="noteAt">At (sec)</Label>
          <Input id="noteAt" type="number" min={0} max={durationSec ?? undefined} step={0.1} value={draftAt} onChange={(e) => onDraftAt(Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="noteText">What you heard at {fmt(draftAt)}</Label>
          <textarea
            id="noteText"
            ref={noteRef}
            rows={2}
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl/Cmd+Enter adds the note without leaving the keyboard.
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onAdd();
            }}
            placeholder='e.g. "I am working in" → "I work in"'
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink placeholder:text-mist hover:border-border-strong focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button variant={severity === "minor" ? "primary" : "outline"} size="sm" onClick={() => onSeverity("minor")} aria-pressed={severity === "minor"}>
          Minor
        </Button>
        <Button variant={severity === "major" ? "primary" : "outline"} size="sm" onClick={() => onSeverity("major")} aria-pressed={severity === "major"}>
          Major
        </Button>
        <Button size="sm" className="ml-auto" onClick={onAdd}>
          Add note
        </Button>
      </div>
    </Card>
  );
}
