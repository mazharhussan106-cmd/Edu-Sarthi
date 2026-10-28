// Owns the two daily flashcard limits in Settings → Flashcard: how many new
// cards a day, and the optional cap on reviews (lib/flashcards applies both,
// per tab).
//
// It saves on tap, like every other setting. It deliberately does NOT say how
// many cards are due now; that belongs to the Flashcard tab, which counts them.

"use client";

import { useState } from "react";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useSavePreference } from "@/app/(shared)/settings/useSavePreference";
import { NEW_PER_DAY_OPTIONS, REVIEWS_PER_DAY_OPTIONS } from "@/lib/preferences";

export function StudyLimits({ initialNew, initialReviews }: { initialNew: number; initialReviews: number }) {
  const [perDay, setPerDay] = useState(initialNew);
  const [reviews, setReviews] = useState(initialReviews);
  const { save, notice } = useSavePreference();

  return (
    <div className="border-t border-border pt-2">
      <SegmentedControl
        label="New cards per day"
        description="How many new flashcards you learn each day, on top of the ones due for review. Takes effect on your next card."
        options={NEW_PER_DAY_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
        value={String(perDay)}
        onValueChange={(v) => {
          setPerDay(Number(v));
          void save("newPerDay", Number(v));
        }}
      />
      <SegmentedControl
        label="Reviews per day"
        description="A cap on the cards you review each day, on each tab. When you reach it with reviews still due, today's session ends and the rest wait for tomorrow; you can always keep going. Reviews that pile up get harder, so a cap is for busy days, not every day."
        options={REVIEWS_PER_DAY_OPTIONS.map((n) => ({ value: String(n), label: n === 0 ? "No limit" : String(n) }))}
        value={String(reviews)}
        onValueChange={(v) => {
          setReviews(Number(v));
          void save("reviewsPerDay", Number(v));
        }}
      />
      {notice ? <p aria-live="polite" className="mt-2 text-xs text-ink-muted">{notice}</p> : null}
    </div>
  );
}
