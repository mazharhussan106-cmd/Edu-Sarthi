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

/// A link copy sends the share token; a library or institute copy sends the deck id.
export function CopyDeckButton({
  token,
  deckId,
  institute,
  signedIn,
  label = "Copy to my decks",
  then = "deck",
  size,
}: {
  token?: string;
  deckId?: string;
  institute?: boolean;
  signedIn: boolean;
  label?: string;
  /** Where to go after the copy: the deck page, or straight into studying it. */
  then?: "deck" | "study";
  size?: "sm" | "md";
}) {
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
    const res = await callApi<{ id: string }>("/api/decks", token ? { action: "copy", token } : { action: institute ? "copyInstitute" : "copyPublic", deckId });
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    router.push(then === "study" ? `/decks/${res.data.id}/study` : `/decks/${res.data.id}`);
  }

  return (
    <div>
      <Button size={size} disabled={busy} onClick={copy}>{busy ? "Importing…" : label}</Button>
      {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
