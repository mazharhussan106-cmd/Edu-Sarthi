// Owns one card in the deck editor's list: a compact preview with Edit and
// Delete. Edit swaps the row for the CardEditor in place.
//
// It deliberately does NOT add new cards (CardEditor on the page) or study
// them (StudyCard).

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { CardBack, CardFront } from "@/components/decks/CardFace";
import { CardEditor, type EditableCard } from "@/components/decks/CardEditor";
import { callApi } from "@/components/decks/deckClient";

export function CardRow({ deckId, card, staff }: { deckId: string; card: EditableCard; staff: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm("Delete this card? This cannot be undone.")) return;
    setBusy(true);
    const res = await callApi(`/api/decks/${deckId}/cards`, { action: "delete", cardId: card.id });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  if (editing) return <CardEditor deckId={deckId} card={card} staff={staff} onDone={() => setEditing(false)} />;

  const face = card;
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block truncate font-medium text-ink">{card.front}</span>
          <span className="block truncate text-xs text-ink-muted">{card.back}</span>
        </button>
        <div className="flex shrink-0 gap-1">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={remove} aria-label={`Delete card ${card.front}`}>Delete</Button>
        </div>
      </div>
      {open ? (
        <div className="mt-3 flex flex-col gap-3 rounded-lg bg-paper-dim p-3">
          <CardFront card={face} />
          <CardBack card={face} />
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
