// Owns the "Flashcard colour" row in Settings → Appearance and its sheet:
// twelve swatches (lib/cardColors) and a small preview card drawn exactly as
// the real card is, frame and tinted sheet, so the student sees the result
// before leaving Settings.
//
// It saves on tap, like every other setting on this page. It deliberately
// does NOT change the app theme; the colour applies to the flashcard alone.

"use client";

import { useState } from "react";

import { SheetRow } from "@/components/ui/SheetRow";
import { CARD_COLORS, cardFrameStyle, cardSheetStyle, cardSwatch, type CardColor } from "@/lib/cardColors";
import { cn } from "@/lib/utils";

export function CardColorPicker({ initial }: { initial: CardColor }) {
  const [color, setColor] = useState<CardColor>(initial);
  const [notice, setNotice] = useState<string | null>(null);

  async function save(next: CardColor) {
    setColor(next);
    setNotice(null);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardColor: next }),
      });
      if (!res.ok) setNotice("That change may not have saved. Reload to check.");
    } catch {
      setNotice("You are offline, so the colour was not saved. Try again when you are back online.");
    }
  }

  return (
    <SheetRow
      title="Flashcard colour"
      subline="Only the card changes; the app keeps your theme."
      value={CARD_COLORS.find((c) => c.value === color)?.label}
      done
    >
      {/* The preview first, so the change shows above the finger that made it. */}
      <div aria-hidden="true" style={cardFrameStyle(color)} className="mx-auto max-w-[14rem] overflow-hidden rounded-2xl border-[1.5px] border-border-strong bg-surface pb-1.5">
        <p className="bg-tag-navy px-2.5 py-1 font-display text-[10px] font-bold tracking-wider text-surface">FRONT SIDE · RECOGNITION</p>
        <div style={cardSheetStyle(color)} className={cn("bg-surface p-3", color !== "plain" && "mx-1.5 mt-1.5 rounded-xl")}>
          <p className="font-display text-xl font-extrabold text-tag-navy">WORD</p>
          <p className="mt-1 text-[11px] font-bold text-tag-blue">Pronunciation</p>
          <p className="text-xs text-ink">/wɜːd/</p>
          <p className="mt-1 text-[11px] font-bold text-tag-green">Category</p>
          <p className="text-xs text-ink">Preview</p>
        </div>
      </div>

      <div role="radiogroup" aria-label="Flashcard colour" className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {CARD_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={color === c.value}
            onClick={() => void save(c.value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[11px] text-ink hover:bg-hover",
              color === c.value ? "border-accent ring-2 ring-accent/40" : "border-border",
            )}
          >
            <span aria-hidden="true" style={{ backgroundColor: cardSwatch(c.value) }} className="h-8 w-8 rounded-full border border-border-strong" />
            {c.label}
          </button>
        ))}
      </div>
      {notice ? (
        <p aria-live="polite" className="mt-3 text-xs text-error">
          {notice}
        </p>
      ) : null}
    </SheetRow>
  );
}
