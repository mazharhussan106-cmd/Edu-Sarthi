// Owns the question asked right after a deck is copied or imported: "Show
// this deck in which tabs?" (owner's decision 11). Ticks for each of the
// student's own tabs, a field for a new one, then Save or Skip. Whatever the
// answer, the student then goes where the copy would have taken them.
//
// The deck is in My decks either way, so Skip, ✕ and Escape lose nothing.
// Teachers and admins have no study tabs: the server says so and the sheet
// never opens. It deliberately does NOT do the copy (CopyDeckButton does).

"use client";

import { useEffect, useState } from "react";

import { callApi } from "@/components/decks/deckClient";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { TAB_LIMITS, tabNameSchema } from "@/lib/studyTabSchemas";

type Tab = { id: string; name: string; has: boolean };

export function PlaceDeckSheet({ deckId, onDone }: { deckId: string; onDone: () => void }) {
  const [tabs, setTabs] = useState<Tab[] | null>(null);
  const [ticked, setTicked] = useState(new Set<string>());
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /// Tabs that were already full, so the deck could not join them: said once,
  /// then Continue goes on as Save would have.
  const [full, setFull] = useState<string[] | null>(null);

  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        const res = await fetch(`/api/study-tabs?deck=${encodeURIComponent(deckId)}`);
        const raw = await res.text();
        const data = JSON.parse(raw) as { enabled?: boolean; tabs?: Tab[] };
        if (gone) return;
        if (!res.ok || !data.enabled) return onDone();
        setTabs(data.tabs ?? []);
        setTicked(new Set((data.tabs ?? []).filter((t) => t.has).map((t) => t.id)));
      } catch {
        // Not worth stopping a finished copy for: it is in My decks already.
        if (!gone) onDone();
      }
    })();
    return () => {
      gone = true;
    };
    // Asked once per copy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  async function save() {
    const newTab = name.trim() ? tabNameSchema.safeParse(name) : null;
    if (newTab && !newTab.success) return setMessage(newTab.error.issues[0].message);
    // The server checks this too; here it answers at once.
    if (newTab?.data && tabs?.some((t) => t.name.toLowerCase() === newTab.data.toLowerCase())) {
      return setMessage(`You already have a tab called “${newTab.data}”. Tick it above instead.`);
    }
    if (!ticked.size && !newTab) return onDone();
    setBusy(true);
    setMessage(null);
    const r = await callApi<{ full?: string[] }>("/api/study-tabs", { action: "placeDeck", deckId, tabIds: [...ticked], newTab: newTab?.data });
    setBusy(false);
    if (!r.ok) return setMessage(r.error);
    if (r.data.full?.length) return setFull(r.data.full);
    onDone();
  }

  return (
    <Sheet open={tabs !== null} onClose={onDone} title="Show this deck in which tabs?">
      <p className="text-sm text-ink-muted">
        Your copy is in My decks. Tick any of your tabs it should show in too, or make a new tab for it.
      </p>
      {tabs?.length ? (
        <fieldset className="mt-3">
          <legend className="text-xs font-medium text-ink-muted">Your tabs</legend>
          <ul className="mt-1 divide-y divide-border rounded-xl border border-border">
            {tabs.map((t) => (
              <li key={t.id}>
                <label className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={ticked.has(t.id)}
                    onChange={() =>
                      setTicked((s) => {
                        const next = new Set(s);
                        if (!next.delete(t.id)) next.add(t.id);
                        return next;
                      })
                    }
                    className="h-4 w-4 shrink-0 accent-accent"
                  />
                  <span className="min-w-0 truncate">{t.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}
      <div className="mt-3">
        <Label htmlFor="place-new-tab">{tabs?.length ? "Or a new tab" : "New tab"}</Label>
        <Input id="place-new-tab" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example, Exam prep" maxLength={TAB_LIMITS.nameChars} autoComplete="off" />
      </div>
      {full ? (
        <div className="mt-4">
          <p role="status" className="text-sm text-ink">
            {full.map((n) => `“${n}”`).join(", ")} already {full.length === 1 ? "holds" : "hold"} {TAB_LIMITS.decksPerTab} decks, so this deck was not added there. It is in your other ticked tabs and in My decks.
          </p>
          <Button className="mt-3 w-full" onClick={onDone}>
            Continue
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={() => void save()} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onDone} disabled={busy}>
            Skip
          </Button>
        </div>
      )}
      {message ? (
        <p role="alert" className="mt-2 text-sm text-error">
          {message}
        </p>
      ) : null}
    </Sheet>
  );
}
