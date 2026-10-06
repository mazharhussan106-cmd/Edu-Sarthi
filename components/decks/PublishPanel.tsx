// Owns the owner's view of a deck's place in the public library: what state it
// is in, why it was rejected, and the buttons to submit or withdraw.
//
// It deliberately does NOT decide anything — approval is an admin's. The copy
// is plain about waiting, and about edits sending a published deck back.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";
import { DECK_LIMITS } from "@/lib/deckSchemas";

type Props = {
  deckId: string;
  visibility: "PRIVATE" | "LINK" | "PUBLIC";
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  cardCount: number;
};

export function PublishPanel({ deckId, visibility, status, rejectReason, cardCount }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inLibrary = visibility === "PUBLIC";

  async function act(action: "publish" | "unpublish") {
    setBusy(true);
    setError(null);
    const res = await callApi("/api/decks", { action, id: deckId });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-ink">Public library</p>
        {inLibrary && status === "PENDING_REVIEW" ? <Badge variant="accent">Waiting for review</Badge> : null}
        {inLibrary && status === "APPROVED" ? <Badge variant="success">Published</Badge> : null}
        {status === "REJECTED" ? <Badge variant="error">Not approved</Badge> : null}
      </div>
      {status === "REJECTED" && rejectReason ? (
        <p className="rounded-lg bg-error/12 p-2 text-sm text-ink">
          <b>Reviewer’s note:</b> {rejectReason} Fix this, then submit again.
        </p>
      ) : null}
      <p className="text-xs text-ink-muted">
        {!inLibrary
          ? `Submit this deck and an admin checks it before anyone else can find it. It needs at least ${DECK_LIMITS.minCardsToPublish} cards. Nothing is public until it is approved.`
          : status === "APPROVED"
            ? "Anyone signed in can find and copy this deck. If you change it, it goes back to review until an admin approves it again."
            : "An admin will look at it. You can keep working; changes are included in the review."}
      </p>
      <div>
        {inLibrary ? (
          <Button variant="outline" disabled={busy} onClick={() => act("unpublish")}>{status === "APPROVED" ? "Remove from library" : "Withdraw submission"}</Button>
        ) : (
          <Button variant="outline" disabled={busy || cardCount < DECK_LIMITS.minCardsToPublish} onClick={() => act("publish")}>Submit for the public library</Button>
        )}
      </div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
