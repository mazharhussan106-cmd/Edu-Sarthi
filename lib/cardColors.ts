// Owns the flashcard's own colour: a set of card backgrounds a student picks
// for the card alone, separate from the app theme. Cerulean and saffron are
// the brand pair; pink is allowed here even though the app theme avoids it.
//
// The full colour goes on the card's frame. Behind the text it is only a tint:
// a share of the colour mixed into the current theme's surface. Each share
// (`mix`, in %) is the largest that keeps every text colour on the card —
// ink, muted ink and all seven coloured headings — at 4.5:1 or better in all
// five themes, measured against app/globals.css. Dark hues tint least because
// the headings are darkest in Light. Re-measure if a theme or heading colour
// changes. It deliberately does NOT touch anything outside the card.

import type { CSSProperties } from "react";

export const CARD_COLORS = [
  { value: "plain", label: "Plain", mix: 0 },
  { value: "cerulean", label: "Cerulean", mix: 7 },
  { value: "saffron", label: "Saffron", mix: 8 },
  { value: "pink", label: "Pink", mix: 6 },
  { value: "red", label: "Red", mix: 6 },
  { value: "yellow", label: "Yellow", mix: 11 },
  { value: "lime", label: "Lime", mix: 11 },
  { value: "green", label: "Green", mix: 7 },
  { value: "teal", label: "Teal", mix: 7 },
  { value: "navy", label: "Navy", mix: 4 },
  { value: "brown", label: "Brown", mix: 6 },
  { value: "slate", label: "Slate", mix: 6 },
] as const;

export type CardColor = (typeof CARD_COLORS)[number]["value"];
export const CARD_COLOR_VALUES = CARD_COLORS.map((c) => c.value) as [CardColor, ...CardColor[]];

export function cardSwatch(color: CardColor): string {
  return color === "plain" ? "var(--color-surface)" : `var(--color-card-${color})`;
}

/// The card's outer frame: the full colour.
export function cardFrameStyle(color: CardColor): CSSProperties | undefined {
  if (color === "plain") return undefined;
  return { backgroundColor: cardSwatch(color), borderColor: cardSwatch(color) };
}

/// The sheet the text sits on: the theme surface with a measured tint.
export function cardSheetStyle(color: CardColor): CSSProperties | undefined {
  const entry = CARD_COLORS.find((c) => c.value === color);
  if (!entry || entry.mix === 0) return undefined;
  return { backgroundColor: `color-mix(in srgb, ${cardSwatch(color)} ${entry.mix}%, var(--color-surface))` };
}
