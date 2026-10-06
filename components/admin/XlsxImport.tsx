// Owns the Excel import screen: pick a .xlsx, check it, read what was found,
// then import. Nothing is saved by "Check file"; the same file goes up again
// with "Import" so the server keeps nothing in between.
//
// It deliberately does NOT parse the file in the browser — one parser, on the
// server, decides what counts as a valid deck.

"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

type Summary = { cards: number; sheets: { name: string; type: string; cards: number }[]; topics: { topic: string; cards: number }[]; warnings: string[] };
type Reply = { error?: string; errors?: string[]; summary?: Summary; deckId?: string; created?: number; updated?: number };

export function XlsxImport() {
  const uid = useId();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);
  const [checked, setChecked] = useState<Summary | null>(null);

  async function send(commit: boolean) {
    if (!file) return setReply({ error: "Choose an Excel (.xlsx) file first." });
    setBusy(true);
    setReply(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("tags", tags);
    if (commit) fd.set("commit", "1");
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const raw = await res.text();
      let data: Reply;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: "Something went wrong. Try again in a moment." };
      }
      if (!res.ok) setChecked(null);
      else if (!commit) setChecked(data.summary ?? null);
      setReply(res.ok ? (commit ? data : null) : data);
    } catch {
      setReply({ error: "No connection. Nothing was saved — try again when you are back online." });
    }
    setBusy(false);
  }

  const done = reply?.deckId;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor={`${uid}-file`}>Excel file (.xlsx, up to 4 MB)</Label>
        <input
          id={`${uid}-file`}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setChecked(null);
            setReply(null);
            // A starting name from the file, which the admin can change.
            if (f && !title) setTitle(f.name.replace(/\.xlsx$/i, "").replace(/[_-]+/g, " ").trim().slice(0, 80));
          }}
          className="block w-full text-sm text-ink file:mr-3 file:h-10 file:rounded-lg file:border file:border-border-strong file:bg-surface file:px-4 file:text-sm file:text-ink hover:file:bg-hover"
        />
      </div>
      <div>
        <Label htmlFor={`${uid}-title`}>Deck name (uploading the same name again updates that deck)</Label>
        <Input id={`${uid}-title`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${uid}-desc`}>Description (optional)</Label>
          <Input id={`${uid}-desc`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
        </div>
        <div>
          <Label htmlFor={`${uid}-tags`}>Tags (optional, comma separated)</Label>
          <Input id={`${uid}-tags`} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="python, programming" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy || !file} onClick={() => send(false)}>{busy && !checked ? "Checking…" : "Check file"}</Button>
        <Button disabled={busy || !checked || title.trim().length < 3} onClick={() => send(true)}>{busy && checked ? "Importing…" : checked ? `Import ${checked.cards} cards` : "Import"}</Button>
      </div>

      {reply?.error ? (
        <div role="alert" className="rounded-lg border border-error/40 bg-error/10 p-3 text-sm text-ink">
          <p className="font-medium text-error">{reply.error}</p>
          {reply.errors?.length ? <ul className="mt-2 list-disc pl-5">{reply.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
        </div>
      ) : null}

      {checked && !done ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="font-medium text-ink">Found {checked.cards} cards — no problems. Nothing is saved yet.</p>
          <p className="mt-1 text-xs text-ink-muted">{checked.sheets.map((s) => `${s.name}: ${s.cards} (${s.type})`).join(" · ")}</p>
          <ul className="mt-3 grid gap-x-10 gap-y-1 text-sm sm:grid-cols-2">
            {checked.topics.map((t) => <li key={t.topic} className="flex justify-between gap-2"><span className="truncate text-ink">{t.topic}</span><span className="font-mono text-ink-muted">{t.cards}</span></li>)}
          </ul>
          {checked.warnings.length ? <ul className="mt-3 list-disc pl-5 text-xs text-ink-muted">{checked.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul> : null}
        </div>
      ) : null}

      {done ? (
        <div role="status" className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-ink">
          <Badge variant="success">Imported</Badge> {reply?.created} new, {reply?.updated} updated. It is in the library now.{" "}
          <Link href={`/library/${reply?.deckId}`} className="font-medium text-accent hover:underline">Open the deck</Link>
        </div>
      ) : null}
    </div>
  );
}
