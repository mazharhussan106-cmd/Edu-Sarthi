// Owns the teacher's "send back" action: pick a reason, optionally add a
// line, and return the submission to the student instead of auditing it.
//
// It deliberately starts collapsed. Sending back is the exception, and an
// open form above the rubric would invite it as a shortcut for hard audits.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Input";
import { RETURN_REASON_LABEL } from "@/lib/audits";
import { RETURN_REASONS, returnSchema } from "@/lib/validations";

export function SendBackForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof RETURN_REASONS)[number] | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setError(null);
    const parsed = returnSchema.safeParse({
      action: "return",
      submissionId,
      reason: reason || undefined,
      note: note.trim() || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Pick a reason.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: "Something went wrong. Try again." };
      }
      if (!res.ok) {
        setError(data.error ?? "Could not send it back. Try again.");
        setBusy(false);
        return;
      }
      router.push("/queue");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Can’t audit this? Send it back
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <CardTitle>Send back to the student</CardTitle>
      <p className="mt-1 text-xs text-ink-muted">
        They get your reason with tips for re-recording. No audit is saved.
      </p>

      <fieldset className="mt-4 flex flex-col gap-2">
        <legend className="sr-only">Reason</legend>
        {RETURN_REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="return-reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="accent-[var(--color-accent)]"
            />
            {RETURN_REASON_LABEL[r]}
          </label>
        ))}
      </fieldset>

      <div className="mt-4">
        <Label htmlFor="return-note">Note to the student (optional)</Label>
        <textarea
          id="return-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. A fan is running close to the phone."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink placeholder:text-ink-muted hover:border-border-strong focus:border-accent"
        />
      </div>

      {error ? (
        <p role="alert" aria-live="assertive" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button onClick={() => void send()} disabled={busy}>
          {busy ? "Sending…" : "Send back"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
