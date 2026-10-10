// Owns the "post a notice" form on the admin Notices page.
//
// The date fields are datetime-local, which has no timezone; the browser
// turns them into an exact moment before sending, so an admin in India means
// India time and the server never has to guess.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const toIso = (v: string) => (v ? new Date(v).toISOString() : null);

export function NoticeForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", title, body, eventAt: toIso(eventAt), expiresAt: toIso(expiresAt) }),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: "Something went wrong. Try again." };
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
      } else {
        setTitle("");
        setBody("");
        setEventAt("");
        setExpiresAt("");
        router.refresh();
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="notice-title">Title</Label>
        <Input id="notice-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      </div>
      <div>
        <Label htmlFor="notice-body">Message</Label>
        <textarea
          id="notice-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          required
          rows={3}
          className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="notice-event">When it happens (optional)</Label>
          <Input id="notice-event" type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="notice-expires">Hide after (optional)</Label>
          <Input id="notice-expires" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>
      {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
      <Button type="submit" disabled={busy} className="w-fit">{busy ? "Posting…" : "Post notice"}</Button>
    </form>
  );
}
