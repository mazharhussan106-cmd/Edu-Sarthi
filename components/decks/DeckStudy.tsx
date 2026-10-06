// Owns one deck card on the study screen: which side is showing, the card's
// remarks, level and note, saving them, and moving between cards —
//   Known / Unknown → saved, then the next card the review plan picks
//   › or swipe ←    → the next card without answering (skipped this visit)
//   ‹ or swipe →    → the card seen before this one
//
// It is the deck version of FlashcardDeck and deliberately works the same way:
// same CardSurface (frame, turn, swipe, zoom), same CardControls bar, same
// /api/flashcards endpoint and Day 1·3·7·15·30·60 ladder. What differs is only
// what is drawn on the sides (DeckSides) and that the next card is chosen by
// the server from this one deck. History is the tab's own sessionStorage list.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CardControls, type Level, type Remarks } from "@/components/flashcards/CardControls";
import { CardSurface } from "@/components/flashcards/CardSurface";
import { WORD_TITLES } from "@/components/flashcards/CardSides";
import { post, readHistory, writeHistory } from "@/components/flashcards/deckApi";
import { DeckSide, type DeckCardData } from "@/components/decks/DeckSides";
import type { CardColor } from "@/lib/cardColors";
import { skipQuery, withSkipped } from "@/lib/cardSkip";
import { describeDue } from "@/lib/srs";

export type DeckCardState = Remarks & {
  note: string | null;
  recall: Level | null;
  stage: number | null;
  dueAt: string | null;
};

export function DeckStudy({
  card, wordId, state, nextHref, skip, cardColor,
}: { card: DeckCardData; wordId: string; state: DeckCardState; nextHref: string; skip: string[]; cardColor: CardColor }) {
  const router = useRouter();
  const [side, setSide] = useState<0 | 1 | 2>(0);
  const [level, setLevel] = useState<Level>(state.recall ?? "MEDIUM");
  const [remarks, setRemarks] = useState<Remarks>({ confident: state.confident, important: state.important, favourite: state.favourite, doubt: state.doubt });
  const [note, setNote] = useState(state.note ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const h = readHistory();
    if (h[h.length - 1] !== card.code) writeHistory([...h, card.code]);
  }, [card.code]);

  function speak() {
    if (card.audioSrc) {
      void new Audio(card.audioSrc).play().catch(() => setMessage("The recording would not play. Check the volume and try again."));
      return;
    }
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) return setMessage("This phone cannot read aloud. Read the card out loud yourself instead.");
    const u = new SpeechSynthesisUtterance(card.rich?.term ?? card.front);
    const voices = synth.getVoices();
    // Indian English first, so the voice matches what students hear around them.
    u.voice = voices.find((v) => v.lang === "en-IN") ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
    u.lang = u.voice?.lang ?? "en-IN";
    u.rate = 0.85;
    synth.cancel();
    synth.speak(u);
  }

  async function mark(known: boolean) {
    setBusy(true);
    setMessage(null);
    const r = await post({ action: "mark", wordId, known, recall: known ? level : null });
    if (!r.ok) {
      setMessage(r.error);
      setBusy(false);
      return;
    }
    router.push(`${nextHref}${skipQuery(skip)}`);
    router.refresh();
    // Cleared even on success: the same component may be reused for the next card.
    setBusy(false);
  }

  const next = () => router.push(`${nextHref}${skipQuery(withSkipped(skip, card.code))}`);

  function prev() {
    const h = readHistory();
    const at = h.lastIndexOf(card.code);
    if (at <= 0) return setMessage("This is the first card you opened here.");
    writeHistory(h.slice(0, at));
    router.push(`${nextHref}&card=${h[at - 1]}${skipQuery(skip)}`);
  }

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
      <div className="h-[calc(100dvh-14rem-env(safe-area-inset-bottom,0px))] min-h-[26rem] md:h-[calc(100dvh-12rem)] md:max-h-[52rem]">
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
