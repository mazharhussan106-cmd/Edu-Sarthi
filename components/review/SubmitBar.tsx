// Owns the audit workstation's bottom action bar: draft status, what is
// still missing, and the two-step Submit → confirm → send.
//
// Fixed to the bottom so Submit is reachable from anywhere in a long audit,
// and the confirm step names the average and note count one last time,
// because a sent audit cannot be edited.

"use client";

import { Button } from "@/components/ui/Button";

export function SubmitBar({
  savedAt,
  error,
  missing,
  confirming,
  busy,
  average,
  noteCount,
  onReview,
  onBack,
  onSend,
}: {
  savedAt: Date | null;
  error: string | null;
  missing: readonly string[];
  confirming: boolean;
  busy: boolean;
  average: number;
  noteCount: number;
  onReview: () => void;
  onBack: () => void;
  onSend: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-nav-bg backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
        <p className="text-xs text-ink-muted" aria-live="polite">
          {savedAt ? `Draft saved on this device · ${savedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Nothing written yet"}
        </p>
        {error ? (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        ) : missing.length > 0 ? (
          <p role="alert" className="text-xs text-error">
            {missing.join(" · ")}
          </p>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-xs text-ink">
                Send average {average.toFixed(1)} with {noteCount} note{noteCount === 1 ? "" : "s"}? It cannot be edited after.
              </span>
              <Button variant="ghost" onClick={onBack} disabled={busy}>
                Back
              </Button>
              <Button onClick={onSend} disabled={busy}>
                {busy ? "Sending…" : "Yes, send to student"}
              </Button>
            </>
          ) : (
            <Button onClick={onReview} disabled={busy}>
              Submit audit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
