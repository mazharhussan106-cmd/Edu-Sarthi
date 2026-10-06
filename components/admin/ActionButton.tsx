// Owns the one button every admin screen uses to change something: it POSTs a
// JSON body to an /api/admin route, shows the error if there is one, and
// refreshes the page's server data when it succeeds.
//
// With `confirmWord`, the button stays disabled until that word is typed —
// the spec's guard for bans and anything else that cannot be undone. A typed
// word, not a dialog, because a dialog's OK is one reflexive click away.

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";

export function ActionButton({
  url,
  body,
  label,
  busyLabel = "Working…",
  variant = "outline",
  confirmWord,
  askReason = false,
}: {
  url: string;
  body: Record<string, unknown>;
  label: string;
  busyLabel?: string;
  variant?: "primary" | "outline" | "ghost";
  confirmWord?: string;
  /// Adds a required reason field; sent as `reason`. Every change to someone
  /// else's account carries one into the admin log.
  askReason?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsForm = Boolean(confirmWord) || askReason;
  const ready = (!confirmWord || typed === confirmWord) && (!askReason || reason.trim().length >= 3);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(askReason ? { ...body, reason: reason.trim() } : body),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: "Something went wrong. Try again." };
      }
      if (!res.ok) {
        setError(data.error ?? "That did not work. Try again.");
        setBusy(false);
        return;
      }
      setOpen(false);
      setTyped("");
      setReason("");
      setBusy(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  if (needsForm && !open) {
    return (
      <Button size="sm" variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-1.5">
      {needsForm ? (
        <span className="flex flex-col items-end gap-1.5 rounded-lg border border-border bg-surface p-2">
          {askReason ? (
            <input
              aria-label="Reason"
              placeholder="Reason (kept in the admin log)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 w-56 rounded-md border border-border-strong bg-surface px-2 text-xs text-ink placeholder:text-ink-muted"
            />
          ) : null}
          {confirmWord ? (
            <>
              <label htmlFor={id} className="text-[11px] text-ink-muted">
                Type {confirmWord} to confirm
              </label>
              <input
                id={id}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="h-8 w-56 rounded-md border border-border-strong bg-surface px-2 font-mono text-xs text-ink"
              />
            </>
          ) : null}
          <span className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={() => void run()} disabled={busy || !ready}>
              {busy ? busyLabel : label}
            </Button>
          </span>
        </span>
      ) : (
        <Button size="sm" variant={variant} onClick={() => void run()} disabled={busy}>
          {busy ? busyLabel : label}
        </Button>
      )}
      {error ? (
        <span role="alert" className="max-w-56 text-right text-xs text-error">
          {error}
        </span>
      ) : null}
    </span>
  );
}
