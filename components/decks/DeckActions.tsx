// Owns the two deck-level actions that are not editing: the share link (turn
// it on, copy it, turn it off) and deleting the deck.
//
// It deliberately does NOT change the deck's text (DeckForm). Turning the link
// off revokes it for everyone who has it, which the copy says plainly.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";

export function DeckActions({ deckId, shareToken, cardCount }: { deckId: string; shareToken: string | null; cardCount: number }) {
  const router = useRouter();
  const [token, setToken] = useState(shareToken);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const link = token && typeof window !== "undefined" ? `${window.location.origin}/d/${token}` : token ? `/d/${token}` : "";

  async function share(on: boolean) {
    setBusy(true);
    setError(null);
    const res = await callApi<{ token: string | null }>("/api/decks", { action: "share", id: deckId, on });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setToken(res.data.token);
    setCopied(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError("Could not copy. Select the link and copy it by hand.");
    }
  }

  async function remove() {
    if (!window.confirm(`Delete this deck and its ${cardCount} card${cardCount === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBusy(true);
    const res = await callApi("/api/decks", { action: "delete", id: deckId });
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    router.push("/decks");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-ink">Share by link</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          {token
            ? "Anyone with this link can view and copy this deck. They cannot change yours. Turning it off stops the link for everyone."
            : "Private right now. Make a link to let others view and copy this deck."}
        </p>
        {token ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={link} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} className="h-10 min-w-0 flex-1 rounded-lg border border-border-strong bg-paper-dim px-3 text-sm text-ink" />
            <Button variant="outline" onClick={copy}>{copied ? "Copied" : "Copy link"}</Button>
            <Button variant="ghost" disabled={busy} onClick={() => share(false)}>Turn off</Button>
          </div>
        ) : (
          <Button className="mt-2" variant="outline" disabled={busy} onClick={() => share(true)}>Create share link</Button>
        )}
      </div>
      <div>
        <Button variant="ghost" disabled={busy} onClick={remove} className="text-error">Delete deck</Button>
      </div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
