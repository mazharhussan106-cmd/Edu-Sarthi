// Owns the owner's view of a deck's place in the public library: what state it
// is in, why it was rejected, which institute's name it is under, and the
// buttons to submit (through the consent form, PublishConsent) or withdraw. A
// deck shared with an institute can be submitted under the institute's name.
//
// It deliberately does NOT decide anything — approval is an admin's. The copy
// is plain about waiting, and about edits sending a published deck back.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";
import { PublishConsent, type ConsentDefaults, type PublishAs } from "@/components/decks/PublishConsent";
import { DECK_LIMITS } from "@/lib/deckSchemas";

type Props = {
  deckId: string;
  visibility: "PRIVATE" | "LINK" | "PUBLIC" | "INSTITUTE";
  /// Offered only to teachers and admin of an approved institute.
  canShareInstitute?: boolean;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  cardCount: number;
  /// What the submit form starts from: the account's saved answers.
  consent: ConsentDefaults;
  /// A new version of a published deck: submitted the same way, but approving
  /// it updates the live deck instead of publishing a second one.
  version?: boolean;
  /// The institute the owner may publish under (its admin and teachers only).
  institute?: PublishAs;
  /// The institute this deck is in the library under, if any.
  publishedAs?: string | null;
};

export function PublishPanel({ deckId, visibility, status, rejectReason, cardCount, canShareInstitute, consent, version = false, institute = null, publishedAs = null }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inLibrary = visibility === "PUBLIC";

  async function act(action: "unpublish" | "shareDeck" | "unshareDeck") {
    setBusy(true);
    setError(null);
    const res = await callApi(action === "shareDeck" || action === "unshareDeck" ? "/api/institute" : "/api/decks", action === "shareDeck" || action === "unshareDeck" ? { action, deckId } : { action, id: deckId });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  if (visibility === "INSTITUTE") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">Institute</p>
          <Badge variant="success">Shared with your institute</Badge>
        </div>
        <p className="text-xs text-ink-muted">Members of your institute can read and copy this deck. It is not in the public library and needs no admin review.</p>
        {asking && institute ? (
          <PublishConsent deckId={deckId} defaults={consent} institute={{ name: institute.name, locked: true }} onCancel={() => setAsking(false)} onDone={() => { setAsking(false); router.refresh(); }} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy} onClick={() => act("unshareDeck")}>Stop sharing with the institute</Button>
            {institute ? <Button variant="outline" disabled={busy || cardCount < DECK_LIMITS.minCardsToPublish} onClick={() => setAsking(true)}>Submit to the library as {institute.name}</Button> : null}
          </div>
        )}
        {institute && !asking ? <p className="text-xs text-ink-muted">Submitting moves it from inside the institute to the public library, under the institute’s name and logo, once an admin approves it.</p> : null}
        {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-ink">{version ? "Review of this version" : "Public library"}</p>
        {inLibrary && status === "PENDING_REVIEW" ? <Badge variant="accent">Waiting for review</Badge> : null}
        {inLibrary && status === "APPROVED" ? <Badge variant="success">Published</Badge> : null}
        {status === "REJECTED" ? <Badge variant="error">Not approved</Badge> : null}
      </div>
      {inLibrary && publishedAs ? <p className="text-sm text-ink">Published as <b>{publishedAs}</b>.</p> : null}
      {status === "REJECTED" && rejectReason ? (
        <p className="rounded-lg bg-error/12 p-2 text-sm text-ink">
          <b>Reviewer’s note:</b> {rejectReason} Fix this, then submit again.
        </p>
      ) : null}
      <p className="text-xs text-ink-muted">
        {version
          ? !inLibrary
            ? "When this version is ready, submit it. An admin checks it, and once approved it replaces the published deck's cards; followers keep their progress."
            : "An admin will look at it. You can keep working; changes are included in the review."
          : !inLibrary
            ? `Submit this deck and an admin checks it before anyone else can find it. It needs at least ${DECK_LIMITS.minCardsToPublish} cards. Nothing is public until it is approved.`
            : status === "APPROVED"
              ? "Anyone signed in can find, follow and copy this deck. Small fixes go live at once; bigger changes go in a new version."
              : "An admin will look at it. You can keep working; changes are included in the review."}
      </p>
      {inLibrary ? (
        <>
          <div><Button variant="outline" disabled={busy} onClick={() => act("unpublish")}>{status === "APPROVED" ? "Remove from library" : "Withdraw submission"}</Button></div>
          {publishedAs && !version ? <p className="text-xs text-ink-muted">Removing it makes it private and takes the institute’s name off. You can share it with the institute again afterwards.</p> : null}
        </>
      ) : asking ? (
        <PublishConsent deckId={deckId} defaults={consent} institute={version || !institute ? null : { name: institute.name, locked: false }} onCancel={() => setAsking(false)} onDone={() => { setAsking(false); router.refresh(); }} />
      ) : (
        <div><Button variant="outline" disabled={busy || cardCount < DECK_LIMITS.minCardsToPublish} onClick={() => setAsking(true)}>{version ? "Submit this version for review" : "Submit for the public library"}</Button></div>
      )}
      {canShareInstitute && !inLibrary && !asking ? (
        <div className="mt-2 border-t border-border pt-3">
          <p className="text-xs text-ink-muted">Or keep it inside your institute: members can read and copy it, and it is never public.</p>
          <Button className="mt-2" variant="outline" disabled={busy} onClick={() => act("shareDeck")}>Share with my institute</Button>
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
