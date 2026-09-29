// Owns one flashcard on screen: the three pages (Recognition, Understanding,
// Practice) side by side in a swipeable strip with tabs and dots, and the
// controls underneath that mark it and move to the next card.
//
// Swiping is native horizontal scroll with snap points, not a gesture
// library: it works with touch, trackpad and keyboard, and costs no script.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CardControls, type Level, type Remarks } from "@/components/flashcards/CardControls";
import { CardFront } from "@/components/flashcards/CardFront";
import { CardPractice } from "@/components/flashcards/CardPractice";
import { CardUsage } from "@/components/flashcards/CardUsage";
import { describeDue } from "@/lib/srs";
import { cn } from "@/lib/utils";
import type { WordDetails } from "@/lib/wordCard";

export type DeckWord = {
  id: string;
  code: string;
  text: string;
  details: WordDetails;
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

const PAGES = ["Recognition", "Understanding", "Practice"] as const;

async function post(body: object) {
  try {
    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data: { error?: string; dueAt?: string } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: "Something went wrong. Try again." };
    }
    return res.ok ? { ok: true as const, dueAt: data.dueAt } : { ok: false as const, error: data.error ?? "Could not save." };
  } catch {
    return { ok: false as const, error: "No connection. Your answer was not saved — try again." };
  }
}

export function FlashcardDeck({
  word,
  state,
  recordHref,
  nextHref,
}: {
  word: DeckWord;
  state: DeckState;
  recordHref: string | null;
  nextHref: string;
}) {
  const router = useRouter();
  const strip = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
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

  // A new card starts on its first page.
  useEffect(() => {
    strip.current?.scrollTo({ left: 0 });
    setPage(0);
  }, [word.id]);

  function go(i: number) {
    const el = strip.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function speak() {
    if (word.audioUrl) {
      void new Audio(word.audioUrl).play().catch(() => undefined);
      return;
    }
    // The phone's own voice until recorded audio exists. Indian English
    // first, so the model matches what students hear around them.
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) return setMessage("This phone cannot read words aloud.");
    const u = new SpeechSynthesisUtterance(word.text);
    const voices = synth.getVoices();
    u.voice = voices.find((v) => v.lang === "en-IN") ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
    u.lang = u.voice?.lang ?? "en-IN";
    u.rate = 0.85;
    synth.cancel();
    synth.speak(u);
  }

  async function mark(known: boolean) {
    setBusy(true);
    setMessage(null);
    const r = await post({ action: "mark", wordId: word.id, known, recall: known ? level : null });
    if (!r.ok) {
      setMessage(r.error);
      setBusy(false);
      return;
    }
    setMessage(r.dueAt ? `Saved — next review ${describeDue(new Date(r.dueAt))}.` : null);
    router.push(nextHref);
    router.refresh();
    setBusy(false);
  }

  async function remark(k: keyof Remarks, v: boolean) {
    setRemarks((r) => ({ ...r, [k]: v }));
    const r = await post({ action: "remark", wordId: word.id, field: k, value: v });
    if (!r.ok) {
      setRemarks((prev) => ({ ...prev, [k]: !v }));
      setMessage(r.error);
    }
  }

  async function saveNote(n: string) {
    setNote(n);
    const r = await post({ action: "note", wordId: word.id, note: n });
    setMessage(r.ok ? "Note saved." : r.error);
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Card pages" className="grid grid-cols-3 gap-1 rounded-full bg-paper-dim p-1">
        {PAGES.map((p, i) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={page === i}
            onClick={() => go(i)}
            className={cn("rounded-full py-1.5 text-xs font-medium", page === i ? "bg-surface text-ink shadow-sm" : "text-ink-muted")}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border-2 border-ink bg-surface">
        <div
          ref={strip}
          onScroll={(e) => {
            const el = e.currentTarget;
            setPage(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[0, 1, 2].map((i) => (
            <section
              key={i}
              aria-label={PAGES[i]}
              className="max-h-[56vh] w-full shrink-0 snap-start overflow-y-auto p-4"
            >
              {i === 0 ? (
                <CardFront code={word.code} text={word.text} d={word.details} imageUrl={word.imageUrl} onSpeak={speak} meta={word} />
              ) : i === 1 ? (
                <CardUsage d={word.details} />
              ) : (
                <CardPractice
                  d={word.details}
                  stage={state.stage}
                  dueLabel={state.dueAt ? describeDue(new Date(state.dueAt)) : null}
                  videoUrl={word.videoUrl}
                  recordHref={recordHref}
                />
              )}
            </section>
          ))}
        </div>
        <div className="flex justify-center gap-1.5 pb-3" aria-hidden="true">
          {PAGES.map((p, i) => (
            <span key={p} className={cn("h-1.5 rounded-full transition-all", page === i ? "w-5 bg-accent" : "w-1.5 bg-border-strong")} />
          ))}
        </div>
      </div>

      {/* Pinned just above the bottom navigation on phones, as in the design,
          so Known / Unknown are always one thumb-reach away. */}
      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-30 -mx-4 bg-paper/95 px-4 py-2 backdrop-blur md:bottom-0 md:mx-0 md:px-0">
        <CardControls
          busy={busy}
          level={level}
          onLevel={setLevel}
          remarks={remarks}
          onRemark={(k, v) => void remark(k, v)}
          note={note}
          onNote={(n) => void saveNote(n)}
          onMark={(k) => void mark(k)}
        />
      </div>
      {message ? (
        <p aria-live="polite" className="text-center text-xs text-ink-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
