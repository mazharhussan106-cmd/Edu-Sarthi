// Owns the "Copy to my decks" button on a shared deck: sends the share token,
// then opens the new private copy. Signed-out visitors get a sign-in link
// instead, since a copy needs an account to live in.
//
// It deliberately does NOT show the deck (the page does).

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";

/// A link copy sends the share token; a library copy sends the deck id.
export function CopyDeckButton({ token, deckId, signedIn }: { token?: string; deckId?: string; signedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Link href="/login" className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
        Sign in to copy this deck
      </Link>
    );
  }

  async function copy() {
    setBusy(true);
    setError(null);
    const res = await callApi<{ id: string }>("/api/decks", token ? { action: "copy", token } : { action: "copyPublic", deckId });
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    router.push(`/decks/${res.data.id}`);
  }

  return (
    <div>
      <Button disabled={busy} onClick={copy}>{busy ? "Copying…" : "Copy to my decks"}</Button>
      {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
