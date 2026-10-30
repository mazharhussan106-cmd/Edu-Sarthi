// Owns the "Remove" button on one deck row of a study tab: takes the deck out
// of this tab only. The deck, its cards and the student's progress stay, and
// it is still in My decks and any other tab.
//
// It deliberately does NOT ask "are you sure": nothing is lost, and the deck
// is one tick away in "＋ Add decks".

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { callApi } from "@/components/decks/deckClient";

export function RemoveFromTab({ tabId, deckId, title }: { tabId: string; deckId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const r = await callApi("/api/study-tabs", { action: "removeDeck", id: tabId, deckId });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.refresh();
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void remove()}
        disabled={busy}
        aria-label={`Remove ${title} from this tab`}
        className="rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-hover hover:text-ink disabled:opacity-50"
      >
        {busy ? "Removing…" : "Remove"}
      </button>
      {error ? (
        <span role="alert" className="max-w-[12rem] text-right text-xs text-error">
          {error}
        </span>
      ) : null}
    </span>
  );
}
