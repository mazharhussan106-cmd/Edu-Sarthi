// Owns one flashcard on screen: which side is showing, the card's remarks and
// level, saving them, and moving between cards —
//   Known / Unknown → saved, then the next card the review plan picks
//   › or swipe ←    → the next card without answering (skipped this session)
//   ‹ or swipe →    → the card seen before this one
//
// "Before" is a list of codes this tab has shown, kept in sessionStorage. It
// is a convenience only: if storage is blocked, ‹ just says there is nothing
// to go back to. Skips live in the URL (lib/cardSkip), so they survive a
// refresh and vanish when the student leaves the flashcard tab.
//
// Words and chunks share all of this; only the drawing of each side differs
// (CardSides). It deliberately does NOT draw the card or handle gestures
// (CardSurface) or pick the next card (the page, on the server).

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CardControls, type Level, type Remarks } from "@/components/flashcards/CardControls";
import { ChunkSide, WORD_TITLES, WordSide, type ChunkExtras } from "@/components/flashcards/CardSides";
import { CardSurface } from "@/components/flashcards/CardSurface";
import { post, readHistory, writeHistory } from "@/components/flashcards/deckApi";
import type { CardColor } from "@/lib/cardColors";
import { skipQuery, withSkipped } from "@/lib/cardSkip";
import { sayable } from "@/lib/chunkCard";
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
  cardColor,
  chunk,
  autoSpeak = false,
  tallTop = false,
}: {
  word: DeckWord;
  state: DeckState;
  recordHref: string | null;
  nextHref: string;
  skip: string[];
  cardColor: CardColor;
  /** Present for chunk and grammar cards; words leave it out. */
  chunk?: ChunkExtras;
  /** The Chunk tab has one more row of chips above the card. */
  tallTop?: boolean;
  /** Say the word when each card opens (a setting, off by default). */
  autoSpeak?: boolean;
}) {
  const router = useRouter();
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

  useEffect(() => {
    const h = readHistory();
    if (h[h.length - 1] !== word.code) writeHistory([...h, word.code]);
  }, [word.code]);

  function speak() {
    if (word.audioUrl) {
      void new Audio(word.audioUrl).play().catch(() => setMessage("The recording would not play. Check the volume and try again."));
      return;
    }
    // The phone's own voice until recorded audio exists. Indian English
    // first, so the model matches what students hear around them.
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) return setMessage("This phone cannot read words aloud. Use the IPA and Indian pronunciation instead.");
    const u = new SpeechSynthesisUtterance(chunk ? sayable(word.text) : word.text);
    const voices = synth.getVoices();
    u.voice = voices.find((v) => v.lang === "en-IN") ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
    u.lang = u.voice?.lang ?? "en-IN";
    u.rate = 0.85;
    synth.cancel();
    synth.speak(u);
  }

  // Browsers only let a page speak after the student has touched it, so the
  // very first card after a fresh load may stay silent; every later card, which
  // follows a tap on Known / Unknown, speaks.
  useEffect(() => {
    if (autoSpeak) speak();
    // speak() is rebuilt each render; the card changing is the only trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.code, autoSpeak]);

  async function mark(known: boolean) {
    setBusy(true);
    setMessage(null);
    const r = await post({ action: "mark", wordId: word.id, known, recall: known ? level : null });
    if (!r.ok) {
      setMessage(r.error);
      setBusy(false);
      return;
    }
    router.push(`${nextHref}${skipQuery(skip)}`);
    router.refresh();
    // Cleared even on success: if the plan picks this same card again the
    // component is reused, and it must not stay locked.
    setBusy(false);
  }

  function next() {
    router.push(`${nextHref}${skipQuery(withSkipped(skip, word.code))}`);
  }

  function prev() {
    const h = readHistory();
    const at = h.lastIndexOf(word.code);
    if (at <= 0) return setMessage("This is the first card you opened here.");
    writeHistory(h.slice(0, at));
    router.push(`${nextHref}&card=${h[at - 1]}${skipQuery(skip)}`);
  }

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
    onSpeak: speak,
    backToFront: (
      <button type="button" onClick={() => setSide(0)} className="self-center rounded-full px-3 py-1 text-xs text-ink-muted hover:bg-hover">
        ↻ Back to the front
      </button>
    ),
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Tall enough to fill a phone between the chips and the control line;
          the numbers are the header, page chrome and bottom bar around it. */}
      <div
        className={
          tallTop
            ? "h-[calc(100dvh-19.75rem-env(safe-area-inset-bottom,0px))] min-h-[26rem] md:h-[calc(100dvh-16rem)] md:max-h-[52rem]"
            : "h-[calc(100dvh-17.5rem-env(safe-area-inset-bottom,0px))] min-h-[26rem] md:h-[calc(100dvh-14rem)] md:max-h-[52rem]"
        }
      >
        <CardSurface
          side={side}
          titles={WORD_TITLES}
          word={word.text}
          color={cardColor}
          onTurn={() => setSide((s) => ((s + 1) % 3) as 0 | 1 | 2)}
          onSwipe={(dir) => (dir === "next" ? next() : prev())}
        >
          {chunk ? <ChunkSide {...sideProps} extras={chunk} /> : <WordSide {...sideProps} />}
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
      {message ? (
        <p aria-live="polite" className="text-center text-xs text-ink-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
