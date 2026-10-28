// Owns the small pieces the chunk card's sides 1 and 2 are built from, in
// the word card's style: the tone colour maps, an icon row, a tip box, and
// the bordered box with labelled fields. Words and chunks look alike on
// purpose; these are the same shapes as CardFront and CardUsage.
//
// It deliberately holds no card data. Every size is `em` so CardSurface can
// scale a whole side to fit one screen.

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type Tone = "blue" | "saffron" | "green" | "red" | "teal" | "amber" | "navy";

// Literal class names, so Tailwind sees every one at build time.
export const TEXT: Record<Tone, string> = {
  blue: "text-tag-blue", saffron: "text-tag-saffron", green: "text-tag-green", red: "text-tag-red",
  teal: "text-tag-teal", amber: "text-tag-amber", navy: "text-tag-navy",
};
const TINT: Record<Tone, string> = {
  blue: "bg-tag-blue/15", saffron: "bg-tag-saffron/15", green: "bg-tag-green/15", red: "bg-tag-red/15",
  teal: "bg-tag-teal/15", amber: "bg-tag-amber/15", navy: "bg-tag-navy/15",
};
const EDGE: Record<Tone, string> = {
  blue: "border-tag-blue/35", saffron: "border-tag-saffron/35", green: "border-tag-green/35", red: "border-tag-red/35",
  teal: "border-tag-teal/35", amber: "border-tag-amber/35", navy: "border-tag-navy/35",
};

export function Row({ icon: Icon, tone, label, value }: { icon: LucideIcon; tone: Tone; label: string; value?: ReactNode }) {
  if (!value) return null;
  return (
    // The icon sits inside the <dt>: a <dl> group may hold only <dt> and <dd>,
    // or screen readers lose the label/value pairing. The widths add up to the
    // old three columns (1.6em icon + 0.5em gap + 7.4em label), so nothing moves.
    <div className="grid grid-cols-[9.5em_minmax(0,1fr)] items-center gap-[0.5em] border-b border-dashed border-border py-[0.28em] last:border-0">
      <dt className="flex min-w-0 items-center gap-[0.6em]">
        <span className={cn("grid h-[1.5em] w-[1.5em] shrink-0 place-items-center rounded-[0.35em]", TINT[tone], TEXT[tone])}>
          <Icon className="h-[0.9em] w-[0.9em]" aria-hidden="true" />
        </span>
        <span className={cn("text-[0.8em] font-bold", TEXT[tone])}>{label}</span>
      </dt>
      <dd className="text-[0.8em] text-ink">{value}</dd>
    </div>
  );
}

export function Tip({ tone, title, children, className }: { tone: Tone; title: string; children?: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <div className={cn("rounded-[0.6em] border border-border px-[0.6em] py-[0.4em]", className)}>
      <p className={cn("text-[0.72em] font-bold", TEXT[tone])}>{title}</p>
      <div className="text-[0.78em] leading-snug text-ink">{children}</div>
    </div>
  );
}

/// `hindi` marks a box the "Hide Hindi meanings" setting hides. A label that
/// starts with "Hindi" counts too; anything else (a label in Devanagari, the
/// imported decks' "In Your Language") has to say so.
export type Item = { tone: Tone; label: string; body?: ReactNode; hindi?: boolean };

/// A bordered group of fields: stacked with dashed rules, or two side by side
/// for short lists. Empty fields are dropped, a pair left with one field is
/// stacked full width, and a box with none is not drawn at all.
export function Box({ tone, cols = 1, items }: { tone: Tone; cols?: 1 | 2; items: Item[] }) {
  const shown = items.filter((i) => i.body);
  if (!shown.length) return null;
  const pair = cols === 2 && shown.length === 2;
  return (
    <div
      className={cn(
        "rounded-[0.6em] border-[1.3px]",
        EDGE[tone],
        pair
          ? "grid grid-cols-2 [&>*+*]:border-l [&>*+*]:border-border"
          : "[&>*+*]:border-t [&>*+*]:border-dashed [&>*+*]:border-border",
      )}
    >
      {shown.map((i) => (
        <div key={i.label} data-hindi={i.hindi || i.label.startsWith("Hindi") ? "" : undefined} className="min-w-0 px-[0.6em] py-[0.35em]">
          <p className={cn("text-[0.72em] font-bold", TEXT[i.tone])}>{i.label}</p>
          <div className="text-[0.8em] leading-snug text-ink">{i.body}</div>
        </div>
      ))}
    </div>
  );
}
