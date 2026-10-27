// Owns the admin's announcement draft form (subject, the email, the short
// dashboard notice) and the "Email me a test" button, which says when the test
// has gone. Checked with the same schema the API enforces.
//
// It deliberately does NOT start sending: that is a separate button with a
// typed confirmation on the page, because it emails every account holder.

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { adminPost } from "@/components/admin/adminPost";
import { announcementDraftSchema } from "@/lib/announcementSchemas";

const area = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent";

export function AnnouncementForm({ initial }: { initial: { subject: string; body: string; notice: string } }) {
  const uid = useId();
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const check = announcementDraftSchema.safeParse(f);
    if (!check.success) return setError(check.error.issues[0]?.message ?? "Check the form and try again.");
    setBusy(true);
    const res = await adminPost("/api/admin/announcements", { action: "create", ...check.data });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setF({ subject: "", body: "", notice: "" });
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3" noValidate>
      <div>
        <Label htmlFor={`${uid}-subject`}>Email subject</Label>
        <Input id={`${uid}-subject`} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} maxLength={120} />
      </div>
      <div>
        <Label htmlFor={`${uid}-body`}>Email text</Label>
        <textarea id={`${uid}-body`} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={5000} rows={14} className={area} />
        <p className="mt-1 text-xs text-ink-muted">Plain text. A blank line starts a new paragraph; web addresses become links.</p>
      </div>
      <div>
        <Label htmlFor={`${uid}-notice`}>Dashboard notice (one or two sentences)</Label>
        <textarea id={`${uid}-notice`} value={f.notice} onChange={(e) => setF({ ...f, notice: e.target.value })} maxLength={300} rows={2} className={area} />
      </div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      <div><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save draft"}</Button></div>
    </form>
  );
}

export function TestButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  async function run() {
    setBusy(true);
    setNote(null);
    const res = await adminPost("/api/admin/announcements", { action: "test", id });
    setBusy(false);
    setNote(res.ok ? { ok: true, text: "Sent to your email. Check how it reads before you start." } : { ok: false, text: res.error });
  }
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void run()}>{busy ? "Sending…" : "Email me a test"}</Button>
      {note ? <span role={note.ok ? "status" : "alert"} className={note.ok ? "text-xs text-success" : "text-xs text-error"}>{note.text}</span> : null}
    </span>
  );
}
