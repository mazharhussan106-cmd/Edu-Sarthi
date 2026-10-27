// Owns how a published deck changes, as its owner sees it: on the live deck,
// the small-fix rules and "Start a new version" (or the way back into one in
// progress); on a working copy, the banner saying the live deck stays as it is
// until approval, and "Discard this version".
//
// It deliberately does NOT submit a version — PublishPanel does, with the same
// consent form as any deck — and decides nothing: every rule is re-checked on
// the server (lib/smallFix, lib/deckVersion).

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";
import { DECK_LIMITS } from "@/lib/deckSchemas";

/// canStart / canDiscard: only the owner starts or throws away a version;
/// editors the deck is shared with work inside it.
type Props =
  | { mode: "live"; deckId: string; draft: { id: string; status: string } | null; fixedToday: number; canStart?: boolean }
  | { mode: "draft"; deckId: string; liveId: string; liveTitle: string; canDiscard?: boolean };

export function VersionPanel(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await callApi<{ id: string }>("/api/decks", { action: "startVersion", id: props.deckId });
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    router.push(`/decks/${res.data.id}`);
  }

  async function discard() {
    if (props.mode !== "draft" || !window.confirm("Discard this new version? Your changes in it are deleted. The published deck stays as it is.")) return;
    setBusy(true);
    setError(null);
    const res = await callApi("/api/decks", { action: "delete", id: props.deckId });
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    router.push(`/decks/${props.liveId}`);
  }

  if (props.mode === "draft") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/12 p-3">
        <p className="text-sm text-ink">
          <b>New version of “{props.liveTitle}”.</b> Change anything here. The published deck stays in the library, unchanged,
          until an admin approves this version.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/decks/${props.liveId}`} className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover">See the published deck</Link>
          {props.canDiscard === false ? null : <Button variant="ghost" size="sm" disabled={busy} onClick={() => void discard()}>Discard this version</Button>}
        </div>
        {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      </div>
    );
  }

  const { draft, fixedToday } = props;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink">Changing a published deck</p>
      <p className="text-xs text-ink-muted">
        <b className="text-ink">Small fix:</b> tap Edit on a card. Up to {DECK_LIMITS.smallFixChars} characters per field, each card once a
        day, {DECK_LIMITS.smallFixCardsPerDay} cards a day ({fixedToday} used today). It goes live at once; an admin checks it afterwards.
      </p>
      <p className="text-xs text-ink-muted">
        <b className="text-ink">Anything bigger</b> — new or removed cards, pictures, the name — goes in a new version. This deck stays
        in the library while an admin checks it.
      </p>
      {draft ? (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/decks/${draft.id}`} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">Continue your new version</Link>
          {draft.status === "PENDING_REVIEW" ? <Badge variant="accent">waiting for review</Badge> : draft.status === "REJECTED" ? <Badge variant="error">not approved</Badge> : null}
          <span className="text-xs text-ink-muted">Small fixes are paused until it is approved or discarded.</span>
        </div>
      ) : (
        props.canStart === false ? (
          <p className="text-xs text-ink-muted">Only the deck’s owner can start a new version. Once they do, you can edit it here.</p>
        ) : (
          <div><Button variant="outline" disabled={busy} onClick={() => void start()}>{busy ? "Starting…" : "Start a new version"}</Button></div>
        )
      )}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
