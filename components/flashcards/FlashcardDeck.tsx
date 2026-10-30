// Owns one flashcard on screen: which side is showing, the card's remarks and
// level, saving them, and moving between cards —
//   Known / Unknown → saved, then the next card the review plan picks; after
//                     Unknown the card comes round once more a few cards later
//                     as practice (lib/cardAgain), and that look is not saved
//   › or swipe ←    → the next card without answering (skipped this session)
//   ‹ or swipe →    → the card seen before this one
//
// Where each of those goes, the skip and practice lists in the URL, and the
// ‹ history live in useCardNav, shared with deck cards (DeckStudy).
//
// Words, chunks and support cards share all of this; only the drawing of
// each side differs (CardSides). It deliberately does NOT draw the card or handle gestures
// (CardSurface) or pick the next card (the page, on the server).

"use client";

import { useEffect, useState } from "react";

import { CardControls, type Level, type Remarks } from "@/components/flashcards/CardControls";
import { ChunkSide, SUPPORT_TITLES, SupportSide, WORD_TITLES, WordSide, type ChunkExtras } from "@/components/flashcards/CardSides";
import { CardSurface } from "@/components/flashcards/CardSurface";
import { post } from "@/components/flashcards/deckApi";
import { PracticeNotice } from "@/components/flashcards/PracticeNotice";
import { useCardNav } from "@/components/flashcards/useCardNav";
import type { CardColor } from "@/lib/cardColors";
import type { Again } from "@/lib/cardAgain";
import { sayable } from "@/lib/chunkCard";
import { sayText } from "@/lib/speech";
import { describeDue } from "@/lib/srs";

export type DeckWord = {
  id: string;
  code: string;
  text: string;
  details: unknown;
  partOfSpeech: string | null;
  category: string | null;
  cefr: string | null;
  importance: number | null;
  imageUrl: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
};

export type DeckState = Remarks & {
  note: string | null;
  recall: Level | null;
  stage: number | null;
  dueAt: string | null;
};

export function FlashcardDeck({
  word,
  state,
  recordHref,
  nextHref,
  skip,
  again = null,
  practice = false,
  cardColor,
  chunk,
  support = false,
  autoSpeak = false,
  tallTop = false,
}: {
  word: DeckWord;
  state: DeckState;
  recordHref: string | null;
  nextHref: string;
  skip: string[];
  /** Cards waiting for their practice look; null where it is off (a list session). */
  again?: Again | null;
  /** This is that practice look: answers move on and save nothing. */
  practice?: boolean;
  cardColor: CardColor;
  /** Present for chunk and grammar cards; words leave it out. */
  chunk?: ChunkExtras;
  /** A customer-support card: its own sides, and a Slow button. */
  support?: boolean;
  /** The Chunk tab has one more row of chips above the card. */
  tallTop?: boolean;
  /** Say the word when each card opens (a setting, off by default). */
  autoSpeak?: boolean;
}) {
  const nav = useCardNav({ code: word.code, nextHref, skip, again, practice });
  const [side, setSide] = useState<0 | 1 | 2>(0);
  const [level, setLevel] = useState<Level>(state.recall ?? "MEDIUM");
  const [remarks, setRemarks] = useState<Remarks>({
    confident: state.confident,
    important: state.important,
    favourite: state.favourite,
    doubt: state.doubt,
  });
  const [note, setNote] = useState(state.note ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // `rate` is only for the Support card's Listen / Slow buttons; quiet is
  // the automatic speak on opening, which must not show errors.
  function speak(quiet = false, rate?: number) {
    if (word.audioUrl) {
      void new Audio(word.audioUrl).play().catch(() => quiet || setMessage("The recording would not play. Check the volume and try again."));
      return;
    }
    // The phone's own voice until recorded audio exists. Support agents talk
    // to customers abroad, so those cards prefer a British or American voice;
    // every other card stays Indian English first, so the model matches what
    // students hear around them. The student's accent setting overrides both.
    const spoke = sayText(chunk ? sayable(word.text) : word.text, { prefer: support ? ["en-GB", "en-US"] : ["en-IN"], rate });
    if (!spoke && !quiet) setMessage("This phone cannot read words aloud. Use the IPA and Indian pronunciation instead.");
  }

  // Browsers only let a page speak after the student has touched it, so the
  // very first card after a fresh load may stay silent; every later card, which
  // follows a tap on Known / Unknown, speaks.
  useEffect(() => {
    // Quiet: an automatic attempt that fails should not put an error on every card.
    if (autoSpeak) speak(true);
    // speak() is rebuilt each render; the card changing is the only trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.code, autoSpeak]);

  async function mark(known: boolean) {
    // A practice look saves nothing: it only moves on.
    if (practice) return nav.answered(known);
    setBusy(true);
    setMessage(null);
    const r = await post({ action: "mark", wordId: word.id, known, recall: known ? level : null });
    if (!r.ok) {
      setMessage(r.error);
      setBusy(false);
      return;
    }
    nav.answered(known);
    // Cleared even on success: if the plan picks this same card again the
    // component is reused, and it must not stay locked.
    setBusy(false);
  }

  const next = nav.next;
  const prev = () => setMessage(nav.prev());

  async function remark(k: keyof Remarks, v: boolean) {
    setRemarks((r) => ({ ...r, [k]: v }));
    const r = await post({ action: "remark", wordId: word.id, field: k, value: v });
    if (!r.ok) {
      setRemarks((prevState) => ({ ...prevState, [k]: !v }));
      setMessage(r.error);
    }
  }

  async function saveNote(n: string) {
    const r = await post({ action: "note", wordId: word.id, note: n });
    if (r.ok) setNote(n);
    setMessage(r.ok ? "Note saved." : r.error);
  }

  const sideProps = {
    side,
    card: word,
    stage: state.stage,
    dueLabel: state.dueAt ? describeDue(new Date(state.dueAt)) : null,
    recordHref,
    // Checked as a number: the word and chunk fronts pass this straight to
    // onClick, which hands over the click event.
    onSpeak: (rate?: unknown) => speak(false, typeof rate === "number" ? rate : undefined),
    backToFront: (
      <button type="button" onClick={() => setSide(0)} className="self-center rounded-full px-3 py-1 text-xs text-ink-muted hover:bg-hover">
        ↻ Back to the front
      </button>
    ),
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 md:flex-none">
      {practice ? <PracticeNotice /> : null}
      {/* On a phone the card takes whatever height is left between the chips
          and the Known / Unknown bar, so the bar sits right above the bottom
          navigation with no gap on any screen size. From md up the card keeps
          a height tied to the window instead, because there is no bottom bar
          to pin against. */}
      <div
        className={
          tallTop
            ? "relative min-h-[18rem] flex-1 md:h-[calc(100dvh-16rem)] md:max-h-[52rem] md:min-h-[26rem] md:flex-none"
            : "relative min-h-[18rem] flex-1 md:h-[calc(100dvh-14rem)] md:max-h-[52rem] md:min-h-[26rem] md:flex-none"
        }
      >
        {/* Absolutely filled, so the card always gets exactly this box's
            height however the flex columns above resolve. The card fits its
            text to this height and scrolls inside it when it cannot. */}
        <div className="absolute inset-0">
        <CardSurface
          side={side}
          titles={support ? SUPPORT_TITLES : WORD_TITLES}
          word={word.text}
          color={cardColor}
          onTurn={() => setSide((s) => ((s + 1) % 3) as 0 | 1 | 2)}
          onSwipe={(dir) => (dir === "next" ? next() : prev())}
        >
          {support ? (
            <SupportSide {...sideProps} />
          ) : chunk ? (
            <ChunkSide {...sideProps} extras={chunk} />
          ) : (
            <WordSide {...sideProps} />
          )}
        </CardSurface>
        </div>
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
      {message ? (
        <p aria-live="polite" className="text-center text-xs text-ink-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
