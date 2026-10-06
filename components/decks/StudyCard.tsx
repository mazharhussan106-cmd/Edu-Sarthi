// Owns one card on the study screen: front first, "Show answer", then four
// answers that feed the same review ladder as the built-in cards —
//   Didn't know → back to Day 1 · Hard → same gap · Good → next rung · Easy → two rungs
//
// It saves through /api/flashcards (the existing mark action), then asks the
// server page for the next card with router.refresh(). It deliberately does NOT
// pick the next card or hold deck counts — the server page does.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { CardBack, CardFront, type FaceCard } from "@/components/decks/CardFace";
import { RichCard } from "@/components/decks/RichCard";
import { post } from "@/components/flashcards/deckApi";

const ANSWERS = [
  { label: "Didn’t know", known: false, recall: null, hint: "Back tomorrow" },
  { label: "Hard", known: true, recall: "HARD", hint: "Same gap again" },
  { label: "Good", known: true, recall: "MEDIUM", hint: "Longer gap" },
  { label: "Easy", known: true, recall: "EASY", hint: "Much longer gap" },
] as const;

export function StudyCard({ wordId, card }: { wordId: string; card: FaceCard }) {
  const router = useRouter();
  // An imported card shows its three sides as tabs; the rating buttons appear
  // once the learner has looked past the first side.
  const [shown, setShown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function answer(a: (typeof ANSWERS)[number]) {
    setSaving(true);
    setError(null);
    const res = await post({ action: "mark", wordId, known: a.known, recall: a.recall });
    if (!res.ok) {
      setSaving(false);
      setError(res.error);
      return;
    }
    // The next card is chosen on the server; this component is keyed by card
    // id so the new one starts on its front side.
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      {card.rich ? <RichCard rich={card.rich} onSide={(n) => n > 1 && setShown(true)} /> : <CardFront card={card} />}
      {shown ? (
        <>
          {card.rich ? null : (
            <>
              <hr className="my-4 border-border" />
              <CardBack card={card} />
            </>
          )}
          <p className="mt-5 text-xs text-ink-muted">How well did you know it?</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ANSWERS.map((a) => (
              <Button key={a.label} variant={a.label === "Good" ? "primary" : "outline"} disabled={saving} onClick={() => answer(a)} className="h-auto flex-col py-2">
                <span>{a.label}</span>
                <span className="text-[10px] font-normal opacity-80">{a.hint}</span>
              </Button>
            ))}
          </div>
        </>
      ) : (
        <Button className="mt-5 w-full" variant={card.rich ? "outline" : "primary"} onClick={() => setShown(true)}>
          {card.rich ? "I’ve seen the answer — rate it" : "Show answer"}
        </Button>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
