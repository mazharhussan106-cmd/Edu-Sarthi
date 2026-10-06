// Owns the "Report this deck" control on a library deck: a reason, an optional
// note, and the confirmation. One report per person; sending again replaces it.
//
// It deliberately does NOT hide or remove the deck — that is lib/deckReview's
// threshold and an admin's decision.

"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { callApi } from "@/components/decks/deckClient";
import { REPORT_REASONS } from "@/lib/deckSchemas";

export function ReportButton({ deckId }: { deckId: string }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!reason) return setError("Choose a reason first.");
    setBusy(true);
    setError(null);
    const res = await callApi("/api/decks/report", { deckId, reason, note });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
    setOpen(false);
  }

  if (sent) return <p role="status" className="text-sm text-success">Thanks — an admin will look at this deck.</p>;
  if (!open) return <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Report this deck</Button>;

  return (
    <div className="flex max-w-sm flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <div>
        <Label htmlFor={`${uid}-r`}>What is wrong with it?</Label>
        <select id={`${uid}-r`} value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 w-full rounded-lg border border-border-strong bg-surface px-2 text-sm text-ink">
          <option value="">Choose a reason…</option>
          {Object.entries(REPORT_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor={`${uid}-n`}>Details (optional)</Label>
        <textarea id={`${uid}-n`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={send}>{busy ? "Sending…" : "Send report"}</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
      </div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
