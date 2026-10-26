// Owns the "what should the AI read" part of the AI card maker: pasted text
// and PDFs or photos, shown as a short list the person can remove from.
//
// A file is uploaded the moment it is chosen (so its type and size are checked
// then, not after a long wait) and held on the server only until the cards are
// made. It deliberately does NOT call the AI or decide what happens next; the
// panel owns that.

"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { uploadAiSource } from "@/components/decks/deckClient";
import { MAX_SOURCES, MAX_SOURCE_TEXT } from "@/lib/aiCardSchemas";

export type SourceItem =
  | { kind: "text"; key: string; text: string }
  | { kind: "file"; key: string; id: string; name: string };

export function AiSourcesField({ sources, onChange, disabled }: { sources: SourceItem[]; onChange: (next: SourceItem[]) => void; disabled: boolean }) {
  const uid = useId();
  const [pasting, setPasting] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const full = sources.length >= MAX_SOURCES;

  function addText() {
    const t = text.trim();
    if (!t) return setError("Paste some text first.");
    if (t.length > MAX_SOURCE_TEXT) return setError(`Keep each pasted text under ${MAX_SOURCE_TEXT.toLocaleString("en-IN")} characters, or split it into two.`);
    setError(null);
    onChange([...sources, { kind: "text", key: crypto.randomUUID(), text: t }]);
    setText("");
    setPasting(false);
  }

  async function addFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    const res = await uploadAiSource(file);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onChange([...sources, { kind: "file", key: res.data.id, id: res.data.id, name: res.data.name }]);
  }

  function remove(item: SourceItem) {
    onChange(sources.filter((s) => s.key !== item.key));
    // Best effort: if it fails, the daily clean-up removes the file anyway.
    if (item.kind === "file") {
      void fetch("/api/decks/ai-cards/sources", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) }).catch(() => undefined);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-ink-muted">Material for the AI to read (optional)</p>
      <p className="mt-1 text-xs text-ink-muted">
        Paste notes or add a PDF or photo of a chapter. Up to {MAX_SOURCES} items. Files are used once and then deleted.
      </p>

      {sources.length ? (
        <ul className="mt-2 flex flex-col gap-1">
          {sources.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-2 rounded-lg bg-paper-dim px-3 py-1.5 text-sm text-ink">
              <span className="min-w-0 truncate">{s.kind === "file" ? s.name : `Pasted text (${s.text.length.toLocaleString("en-IN")} characters)`}</span>
              <Button variant="ghost" size="sm" disabled={disabled || busy} onClick={() => remove(s)} aria-label={`Remove ${s.kind === "file" ? s.name : "pasted text"}`}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {pasting ? (
        <div className="mt-2">
          <Label htmlFor={`${uid}-text`}>Paste text</Label>
          <textarea
            id={`${uid}-text`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={addText}>Add this text</Button>
            <Button size="sm" variant="ghost" onClick={() => { setPasting(false); setText(""); setError(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <Button size="sm" variant="outline" disabled={disabled || full || busy} onClick={() => setPasting(true)}>Paste text</Button>
          </div>
          <div>
            <Label htmlFor={`${uid}-file`}>{busy ? "Uploading…" : "Add a PDF or photo (up to 10 MB)"}</Label>
            <input
              id={`${uid}-file`}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              disabled={disabled || full || busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                void addFile(f);
              }}
              className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-lg file:border file:border-border-strong file:bg-surface file:px-3 file:py-2 file:text-sm file:text-ink"
            />
          </div>
        </div>
      )}
      {full ? <p className="mt-2 text-xs text-ink-muted">You have added the most allowed. Remove one to add another.</p> : null}
      {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
