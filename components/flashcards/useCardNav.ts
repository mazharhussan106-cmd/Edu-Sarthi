// Owns moving between cards in a study session, the same for built-in cards
// (FlashcardDeck) and deck cards (DeckStudy): where Known / Unknown, › and ‹
// go, with the session's skip list (lib/cardSkip) and practice-after-Unknown
// list (lib/cardAgain) carried in the URL, and the ‹ history kept as cards
// open.
//
// It deliberately does NOT save answers (the card component posts first and
// only then calls `answered`) and draws nothing.

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { readHistory, writeHistory } from "@/components/flashcards/deckApi";
import { afterCard, againQuery, type Again } from "@/lib/cardAgain";
import { skipQuery, withSkipped } from "@/lib/cardSkip";

export function useCardNav({
  code,
  nextHref,
  skip,
  again,
  practice,
}: {
  code: string;
  nextHref: string;
  skip: string[];
  /** null where practice-after-Unknown is off (a "Study this list" session). */
  again: Again | null;
  practice: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const h = readHistory();
    if (h[h.length - 1] !== code) writeHistory([...h, code]);
  }, [code]);

  /// The again list once this card is left; `unknown` puts it back to come round.
  const againAfter = (unknown: boolean) => (again ? againQuery(afterCard(again, code, unknown)) : "");

  return {
    /// After an answer. A practice look's answer never queues the card again.
    answered(known: boolean) {
      router.push(`${nextHref}${skipQuery(skip)}${againAfter(!practice && !known)}`);
      router.refresh();
    },
    /// › or swipe: skipped for this session. A practice card passed over is
    /// not skipped, just done.
    next() {
      router.push(`${nextHref}${skipQuery(practice ? skip : withSkipped(skip, code))}${againAfter(false)}`);
    },
    /// ‹ or swipe back. Returns a message when there is nothing to go back to.
    prev(): string | null {
      const h = readHistory();
      const at = h.lastIndexOf(code);
      if (at <= 0) return "This is the first card you opened here.";
      writeHistory(h.slice(0, at));
      router.push(`${nextHref}&card=${h[at - 1]}${skipQuery(skip)}${again ? againQuery(again) : ""}`);
      return null;
    },
  };
}
