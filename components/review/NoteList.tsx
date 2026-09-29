// Owns rendering timestamped notes as a list where each timestamp seeks the
// player. Used by both sides: the teacher writing an audit and the student
// reading one.
//
// It deliberately takes onRemove as optional rather than having a `readOnly`
// flag. The absence of a remove handler IS read-only, and there is no way to
// pass one and still get a list that ignores it.

"use client";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import type { NoteInput } from "@/lib/validations";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function NoteList({
  notes,
  onSeek,
  onRemove,
}: {
  notes: readonly NoteInput[];
  onSeek?: (seconds: number) => void;
  onRemove?: (index: number) => void;
}) {
  if (notes.length === 0) return null;

  return (
    <ul className="divide-y divide-border border-y border-border">
      {notes.map((n, i) => (
        <li key={`${n.at}-${i}`} className="flex items-start gap-3 py-3">
          {onSeek ? (
            <button
              type="button"
              onClick={() => onSeek(n.at)}
              // The label says what pressing it does. "0:42" alone tells a
              // screen reader user a number, not an action.
              aria-label={`Play from ${formatTime(n.at)}`}
              className="shrink-0 font-mono text-xs text-accent hover:underline"
            >
              {formatTime(n.at)}
            </button>
          ) : (
            <span className="shrink-0 font-mono text-xs text-accent">
              {formatTime(n.at)}
            </span>
          )}

          <p className="min-w-0 flex-1 text-sm text-ink">{n.note}</p>

          <Badge variant={n.severity === "major" ? "error" : "neutral"}>
            {n.severity}
          </Badge>

          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`Remove the note at ${formatTime(n.at)}`}
              className="shrink-0 text-ink-muted hover:text-error"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
