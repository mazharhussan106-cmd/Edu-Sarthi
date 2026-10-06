// Owns the heart on a library deck: shows the count, toggles the viewer's own
// like, and updates at once — undoing itself with a message if the save fails.
//
// It deliberately does NOT decide who may like (the API refuses your own deck
// and unpublished decks); `disabled` only stops offering it.

"use client";

import { useState } from "react";

import { callApi } from "@/components/decks/deckClient";
import { cn } from "@/lib/utils";

export function LikeButton({ deckId, likes, liked, disabled }: { deckId: string; likes: number; liked: boolean; disabled?: boolean }) {
  const [state, setState] = useState({ likes, liked });
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const before = state;
    const on = !state.liked;
    setState({ liked: on, likes: Math.max(0, state.likes + (on ? 1 : -1)) });
    setError(null);
    const res = await callApi<{ likes: number }>("/api/decks/like", { deckId, on });
    if (!res.ok) {
      setState(before);
      return setError(res.error);
    }
    setState({ liked: on, likes: res.data.likes });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={state.liked}
        aria-label={`${state.liked ? "Unlike" : "Like"} this deck, ${state.likes} like${state.likes === 1 ? "" : "s"}`}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium",
          state.liked ? "border-accent bg-accent/12 text-accent" : "border-border-strong text-ink hover:bg-hover",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <span aria-hidden="true">{state.liked ? "♥" : "♡"}</span>
        <span className="font-mono">{state.likes}</span>
      </button>
      {error ? <span role="alert" className="mt-1 text-xs text-error">{error}</span> : null}
    </span>
  );
}
