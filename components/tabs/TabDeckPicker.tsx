// Owns "＋ Add decks" on a study tab's page: a sheet listing every deck the
// student could put in the tab (their own, followed and shared ones), ticked
// where the deck is already in it, saved in one request.
//
// It deliberately does NOT decide which decks are allowed: the list comes from
// the server, and the server checks again on save (lib/studyTabs).

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { callApi } from "@/components/decks/deckClient";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { TAB_LIMITS } from "@/lib/studyTabSchemas";

export function TabDeckPicker({ tabId, tabName, decks, selected }: { tabId: string; tabName: string; decks: { id: string; title: string }[]; selected: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ticked, setTicked] = useState(new Set(selected));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function flip(id: string) {
    setTicked((t) => {
      const next = new Set(t);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  async function save() {
    if (ticked.size > TAB_LIMITS.decksPerTab) return setMessage(`A tab holds up to ${TAB_LIMITS.decksPerTab} decks. Untick some, then save.`);
    setBusy(true);
    setMessage(null);
    const r = await callApi("/api/study-tabs", { action: "setDecks", id: tabId, deckIds: [...ticked] });
    setBusy(false);
    if (!r.ok) return setMessage(r.error);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        aria-haspopup="dialog"
        onClick={() => {
          setTicked(new Set(selected));
          setMessage(null);
          setOpen(true);
        }}
      >
        ＋ Add decks
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Decks in ${tabName}`}>
        {decks.length ? (
          <fieldset>
            <legend className="text-xs text-ink-muted">Tick the decks this tab should show. They stay in My decks too.</legend>
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
              {decks.map((d) => (
                <li key={d.id}>
                  <label className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm text-ink">
                    <input type="checkbox" checked={ticked.has(d.id)} onChange={() => flip(d.id)} className="h-4 w-4 shrink-0 accent-accent" />
                    <span className="min-w-0 truncate">{d.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            <Button className="mt-3 w-full" onClick={() => void save()} disabled={busy}>
              {busy ? "Saving…" : `Save · ${ticked.size} deck${ticked.size === 1 ? "" : "s"}`}
            </Button>
          </fieldset>
        ) : (
          <p className="text-sm text-ink-muted">
            You have no decks to add yet. Make one in{" "}
            <Link href="/decks#new-deck" className="font-medium text-accent hover:underline">My decks</Link>, or follow one in the{" "}
            <Link href="/library" className="font-medium text-accent hover:underline">Library</Link>.
          </p>
        )}
        {message ? (
          <p role="alert" className="mt-2 text-sm text-error">
            {message}
          </p>
        ) : null}
      </Sheet>
    </>
  );
}
