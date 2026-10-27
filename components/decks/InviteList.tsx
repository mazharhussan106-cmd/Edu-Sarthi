// Owns the invitations waiting for someone in My decks: Accept or Decline, and
// the Leave button on a deck shared with them. An
// invitation to edit a deck that is in the public library also asks for the
// two ticks that editing there needs (18 or older, the library terms).
//
// It deliberately does NOT decide anything; the server re-checks the ticks
// and that the invitation is for this person's email (lib/deckMembers).

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { callApi } from "@/components/decks/deckClient";

export type Invitation = { id: string; role: "VIEW" | "EDIT"; title: string; from: string; isPublic: boolean };

const tick = "mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]";

function Row({ inv, adultConfirmed }: { inv: Invitation; adultConfirmed: boolean }) {
  const router = useRouter();
  const needsTerms = inv.role === "EDIT" && inv.isPublic;
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "accept" | "decline") {
    setBusy(true);
    setError(null);
    const res = await callApi("/api/decks/members", action === "accept" ? { action, memberId: inv.id, adult, terms } : { action, memberId: inv.id });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-2 p-4">
      <p className="text-sm text-ink">
        <b>{inv.from}</b> invited you to {inv.role === "EDIT" ? "edit" : "view"} <b>“{inv.title}”</b>.
      </p>
      {needsTerms ? (
        <div className="flex flex-col gap-1.5">
          {adultConfirmed ? null : (
            <label className="flex items-start gap-2 text-sm text-ink">
              <input type="checkbox" className={tick} checked={adult} onChange={(e) => setAdult(e.target.checked)} />
              <span>I am 18 or older. (This deck is in the public library; editing it is open from 18.)</span>
            </label>
          )}
          <label className="flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" className={tick} checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>
              What I add is published under the deck’s licence, and EduSarthi may use it in paid features. I follow the{" "}
              <Link href="/legal/library-rules" target="_blank" className="text-accent underline">library rules</Link>.
            </span>
          </label>
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => void act("accept")}>Accept</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act("decline")}>Decline</Button>
      </div>
    </Card>
  );
}

export function InviteList({ invitations, adultConfirmed }: { invitations: Invitation[]; adultConfirmed: boolean }) {
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {invitations.map((inv) => <li key={inv.id}><Row inv={inv} adultConfirmed={adultConfirmed} /></li>)}
    </ul>
  );
}

/// "Leave" on a deck shared with this person: they stop seeing it; their own
/// study progress on its cards is kept in case they are invited again.
export function LeaveButton({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  async function leave() {
    if (!window.confirm("Leave this deck? You will stop seeing it. The owner can invite you again.")) return;
    const res = await callApi("/api/decks/members", { action: "leave", deckId });
    if (!res.ok) return setError(res.error);
    router.push("/decks");
  }
  return (
    <span>
      <Button variant="ghost" size="sm" onClick={() => void leave()}>Leave</Button>
      {error ? <span role="alert" className="ml-2 text-xs text-error">{error}</span> : null}
    </span>
  );
}
