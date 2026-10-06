// Owns a library or institute card on screen for reading: the same CardSurface
// as the study screen — frame, turn, swipe, zoom — with ‹ and › to move through
// the deck. It deliberately has no Known / Unknown bar: the original deck is
// view-only, and studying happens in a copy with its own schedule.
//
// The neighbouring cards arrive as links from the server page, so swiping is a
// plain navigation and works with back and refresh.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CardSurface } from "@/components/flashcards/CardSurface";
import { WORD_TITLES } from "@/components/flashcards/CardSides";
import { DeckSide, type DeckCardData } from "@/components/decks/DeckSides";
import type { CardColor } from "@/lib/cardColors";

export function DeckCardView({ card, prevHref, nextHref, cardColor }: { card: DeckCardData; prevHref: string | null; nextHref: string | null; cardColor: CardColor }) {
  const router = useRouter();
  const [side, setSide] = useState<0 | 1 | 2>(0);
  const nav = "inline-flex h-11 min-w-24 items-center justify-center rounded-xl border border-border-strong font-display text-[13px] font-bold text-ink hover:bg-hover";
  return (
    <div className="flex flex-col gap-2">
      <div className="h-[calc(100dvh-14rem-env(safe-area-inset-bottom,0px))] min-h-[26rem] md:h-[calc(100dvh-12rem)] md:max-h-[52rem]">
        <CardSurface
          side={side}
          titles={WORD_TITLES}
          word={card.front}
          color={cardColor}
          onTurn={() => setSide((s) => ((s + 1) % 3) as 0 | 1 | 2)}
          onSwipe={(dir) => {
            const to = dir === "next" ? nextHref : prevHref;
            if (to) router.push(to);
          }}
        >
          <DeckSide
            side={side}
            card={card}
            stage={null}
            dueLabel={null}
            onSpeak={() => {
              const u = new SpeechSynthesisUtterance(card.rich?.term ?? card.front);
              u.lang = "en-IN";
              window.speechSynthesis?.cancel();
              window.speechSynthesis?.speak(u);
            }}
            backToFront={<button type="button" onClick={() => setSide(0)} className="self-center rounded-full px-3 py-1 text-xs text-ink-muted hover:bg-hover">↻ Back to the front</button>}
          />
        </CardSurface>
      </div>
      <div className="flex justify-between gap-2">
        {prevHref ? <Link href={prevHref} className={nav}>‹ Previous</Link> : <span />}
        {nextHref ? <Link href={nextHref} className={nav}>Next ›</Link> : <span />}
      </div>
    </div>
  );
}
