// Owns "New cards per day" in Settings → Flashcard (lib/flashcards applies it,
// per tab). Reviews have no daily limit: a student may review as many cards as
// are due (owner's decision, 28 Oct).
//
// It saves on tap, like every other setting. It deliberately does NOT say how
// many cards are due now; that belongs to the Flashcard tab, which counts them.

"use client";

import { useState } from "react";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useSavePreference } from "@/app/(shared)/settings/useSavePreference";
import { NEW_PER_DAY_OPTIONS } from "@/lib/preferences";

export function StudyLimits({ initialNew }: { initialNew: number }) {
  const [perDay, setPerDay] = useState(initialNew);
  const { save, notice } = useSavePreference();

  return (
    <div className="border-t border-border pt-2">
      <SegmentedControl
        label="New cards per day"
        description="How many new flashcards you learn each day, on top of the ones due for review. Reviews have no limit. Takes effect on your next card."
        options={NEW_PER_DAY_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
        value={String(perDay)}
        onValueChange={(v) => {
          setPerDay(Number(v));
          void save("newPerDay", Number(v));
        }}
      />
      {notice ? <p aria-live="polite" className="mt-2 text-xs text-ink-muted">{notice}</p> : null}
    </div>
  );
}
