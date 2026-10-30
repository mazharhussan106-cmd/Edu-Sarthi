// Owns the notice an editor sees before they have accepted the library terms.
// On a deck in the public library (or a new version of one) it blocks editing:
// what they add goes public too. On a private deck it is only a request — the
// owner cannot submit the deck until every editor has confirmed.
//
// It deliberately does NOT unlock anything by itself; the server records the
// answer and every edit re-checks it (lib/deckAccess editBlock).

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";

const tick = "mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]";

export function EditorTerms({ deckId, adultConfirmed, blocking }: { deckId: string; adultConfirmed: boolean; blocking: boolean }) {
  const router = useRouter();
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const res = await callApi("/api/decks/members", { action: "confirm", deckId, adult, terms });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/12 p-3">
      <p className="text-sm text-ink">
        {blocking ? <><b>This deck is in the public library.</b> Before you edit it:</> : <>Before the owner can publish this deck to the library, each editor confirms:</>}
      </p>
      {adultConfirmed ? null : (
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className={tick} checked={adult} onChange={(e) => setAdult(e.target.checked)} />
          <span>I am 18 or older.</span>
        </label>
      )}
      <label className="flex items-start gap-2 text-sm text-ink">
        <input type="checkbox" className={tick} checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>
          What I add is published under the deck’s licence, can be read by anyone with or without an account, and EduSarthi may use it in paid features. I follow the{" "}
          <Link href="/legal/library-rules" target="_blank" className="text-accent underline">library rules</Link>.
        </span>
      </label>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      <div><Button size="sm" disabled={busy} onClick={() => void confirm()}>{busy ? "Saving…" : blocking ? "Confirm and edit" : "Confirm"}</Button></div>
    </div>
  );
}
