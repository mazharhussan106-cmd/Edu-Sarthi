// Owns "Follow and study" and "Unfollow" on a library deck. Following opens the
// study page straight away: the point of the button is to start learning.
//
// It deliberately does NOT copy anything. A follower studies the original with
// their own progress; "Make my own copy" (CopyDeckButton) is the other path.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";

export function FollowButton({ deckId, following, signedIn = true, size }: { deckId: string; following: boolean; signedIn?: boolean; size?: "sm" | "md" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Link href="/login" className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
        Sign in to study this deck
      </Link>
    );
  }

  async function run(action: "follow" | "unfollow") {
    setBusy(true);
    setError(null);
    const res = await callApi("/api/decks", { action, deckId });
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    if (action === "follow") return router.push(`/library/${deckId}/study`);
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      {following ? (
        <span className="flex flex-wrap gap-2">
          <Link href={`/library/${deckId}/study`} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
            Study
          </Link>
          <Button variant="ghost" size={size} disabled={busy} onClick={() => void run("unfollow")}>{busy ? "Unfollowing…" : "Unfollow"}</Button>
        </span>
      ) : (
        <Button size={size} disabled={busy} onClick={() => void run("follow")}>{busy ? "Following…" : "Follow and study"}</Button>
      )}
      {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
