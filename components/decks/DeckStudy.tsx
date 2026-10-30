// Owns one deck card on the study screen: which side is showing, the card's
// remarks, level and note, saving them, and moving between cards —
//   Known / Unknown → saved, then the next card the review plan picks; after
//                     Unknown it comes round once more as practice (lib/cardAgain)
//   › or swipe ←    → the next card without answering (skipped this visit)
//   ‹ or swipe →    → the card seen before this one
//
// It is the deck version of FlashcardDeck and deliberately works the same way:
// same CardSurface (frame, turn, swipe, zoom), same CardControls bar, same
// /api/flashcards endpoint and Day 3·7·15·30·60·120·180 ladder. What differs is only
// what is drawn on the sides (DeckSides) and that the next card is chosen by
// the server from this one deck. Moving between cards is useCardNav, the
// same hook FlashcardDeck uses.

"use client";

import { useState } from "react";

import { CardControls, type Level, type Remarks } from "@/components/flashcards/CardControls";
import { CardSurface } from "@/components/flashcards/CardSurface";
import { WORD_TITLES } from "@/components/flashcards/CardSides";
import { post } from "@/components/flashcards/deckApi";
import { PracticeNotice } from "@/components/flashcards/PracticeNotice";
import { useCardNav } from "@/components/flashcards/useCardNav";
import { DeckSide, type DeckCardData } from "@/components/decks/DeckSides";
import type { CardColor } from "@/lib/cardColors";
import type { Again } from "@/lib/cardAgain";
import { sayText } from "@/lib/speech";
import { describeDue } from "@/lib/srs";

export type DeckCardState = Remarks & {
  note: string | null;
  recall: Level | null;
  stage: number | null;
  dueAt: string | null;
};

export function DeckStudy({
  card, wordId, state, nextHref, skip, again = null, practice = false, cardColor, tabsAbove = false,
}: {
  card: DeckCardData;
  wordId: string;
  state: DeckCardState;
  nextHref: string;
  skip: string[];
  /** Cards waiting for their practice look after Unknown (lib/cardAgain); null where it is off. */
  again?: Again | null;
  /** This is that practice look: answers move on and save nothing. */
  practice?: boolean;
  cardColor: CardColor;
  /** The study tabs row sits above (a student's study page): the card gives up its 2.5rem. */
  tabsAbove?: boolean;
}) {
  const nav = useCardNav({ code: card.code, nextHref, skip, again, practice });
  const [side, setSide] = useState<0 | 1 | 2>(0);
  const [level, setLevel] = useState<Level>(state.recall ?? "MEDIUM");
  const [remarks, setRemarks] = useState<Remarks>({ confident: state.confident, important: state.important, favourite: state.favourite, doubt: state.doubt });
  const [note, setNote] = useState(state.note ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function speak() {
    if (card.audioSrc) {
      void new Audio(card.audioSrc).play().catch(() => setMessage("The recording would not play. Check the volume and try again."));
      return;
    }
    // Indian English first unless the student chose an accent in Settings.
    if (!sayText(card.rich?.term ?? card.front)) setMessage("This phone cannot read aloud. Read the card out loud yourself instead.");
  }

  async function mark(known: boolean) {
    // A practice look saves nothing: it only moves on.
    if (practice) return nav.answered(known);
    setBusy(true);
    setMessage(null);
    const r = await post({ action: "mark", wordId, known, recall: known ? level : null });
    if (!r.ok) {
      setMessage(r.error);
      setBusy(false);
      return;
    }
    nav.answered(known);
    // Cleared even on success: the same component may be reused for the next card.
    setBusy(false);
  }

  const next = nav.next;
  const prev = () => setMessage(nav.prev());

  async function remark(k: keyof Remarks, v: boolean) {
    setRemarks((r) => ({ ...r, [k]: v }));
    const r = await post({ action: "remark", wordId, field: k, value: v });
    if (!r.ok) {
      setRemarks((p) => ({ ...p, [k]: !v }));
      setMessage(r.error);
    }
  }

  async function saveNote(n: string) {
    const r = await post({ action: "note", wordId, note: n });
    if (r.ok) setNote(n);
    setMessage(r.ok ? "Note saved." : r.error);
  }

  return (
    <div className="flex flex-col gap-2">
      {practice ? <PracticeNotice /> : null}
      {/* Literal classes, so Tailwind sees both. With the tabs row, everything is
          2.5rem shorter, the minimum too, so Known stays above the bottom bar on
          a small phone instead of sliding under it. */}
      <div
        className={
          tabsAbove
            ? "h-[calc(100dvh-16.5rem-env(safe-area-inset-bottom,0px))] min-h-[23.5rem] md:h-[calc(100dvh-14.5rem)] md:max-h-[52rem]"
            : "h-[calc(100dvh-14rem-env(safe-area-inset-bottom,0px))] min-h-[26rem] md:h-[calc(100dvh-12rem)] md:max-h-[52rem]"
        }
      >
        <CardSurface
          side={side}
          titles={WORD_TITLES}
          word={card.front}
          color={cardColor}
          onTurn={() => setSide((s) => ((s + 1) % 3) as 0 | 1 | 2)}
          onSwipe={(dir) => (dir === "next" ? next() : prev())}
        >
          <DeckSide
            side={side}
            card={card}
            stage={state.stage}
            dueLabel={state.dueAt ? describeDue(new Date(state.dueAt)) : null}
            onSpeak={speak}
            backToFront={
              <button type="button" onClick={() => setSide(0)} className="self-center rounded-full px-3 py-1 text-xs text-ink-muted hover:bg-hover">
                ↻ Back to the front
              </button>
            }
          />
        </CardSurface>
      </div>
      <CardControls
        busy={busy}
        level={level}
        onLevel={setLevel}
        remarks={remarks}
        onRemark={(k, v) => void remark(k, v)}
        note={note}
        onNote={(n) => void saveNote(n)}
        onMark={(k) => void mark(k)}
        onPrev={prev}
        onNext={next}
      />
      {message ? <p aria-live="polite" className="text-center text-xs text-ink-muted">{message}</p> : null}
    </div>
  );
}
