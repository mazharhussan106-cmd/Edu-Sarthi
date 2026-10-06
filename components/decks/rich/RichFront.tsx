// Owns side 1 of an imported 56-point card, "Recognition", in the EduSarthi
// card's own style: the concept large with its sound, the recall question in a
// highlighted box, a coloured icon row per profile field, then the memory aids.
//
// Like the word and chunk cards it deliberately gives no meaning — side 1 is a
// recall test. It reuses Row and Tip from the chunk card, so every kind of card
// looks alike; sizes are `em` so CardSurface can fit the side to one screen.
// The recall question is the sheet's own; the older Python layout has none, and
// its reverse prompt has its "(Answer: …)" tail cut off so nothing leaks.

import { BarChart3, BookOpen, Layers, Signal, Star, Volume2 } from "lucide-react";

import { Row, Tip } from "@/components/flashcards/chunk/parts";
import { cn } from "@/lib/utils";

type F = Record<string, string>;

function textSize(t: string): string {
  if (t.length <= 14) return "text-[1.9em]";
  if (t.length <= 26) return "text-[1.5em]";
  return "text-[1.25em]";
}

export function cueOf(f: F): string {
  if (f.cue) return f.cue;
  const reverse = (f.quick_recall ?? "").replace(/\s*\(\s*answer\s*:[\s\S]*$/i, "").trim();
  return reverse || "Before you turn the card: what is it, and when would you use it?";
}

const stars = (n?: string) => (n && /^[1-5]$/.test(n) ? `${"★".repeat(Number(n))}${"☆".repeat(5 - Number(n))} (${n}/5)` : null);

export function RichFront({ code, f, onSpeak }: { code: string; f: F; onSpeak: () => void }) {
  return (
    <div className="flex flex-col gap-[0.5em]">
      <div>
        <span className="inline-block rounded-[0.3em] bg-tag-navy px-[0.5em] py-[0.12em] font-display text-[0.6em] font-bold text-surface">ID {f.id ?? code}</span>
        <p className={cn("mt-[0.2em] font-display font-extrabold leading-tight text-tag-navy", textSize(f.term ?? ""))}>{f.term}</p>
        <button
          type="button"
          onClick={onSpeak}
          aria-label={`Listen to ${f.term}`}
          className="mt-[0.3em] inline-flex items-center gap-[0.5em] rounded-full border border-border-strong px-[0.7em] py-[0.25em] text-[0.8em] text-ink hover:bg-hover"
        >
          <Volume2 className="h-[1em] w-[1em] text-tag-blue" aria-hidden="true" />
          {f.pronunciation || "Listen"}
        </button>
      </div>

      <Tip tone="blue" title="Recall first — before you turn the card" className="bg-tag-blue/10">
        <span className="font-medium">{cueOf(f)}</span>
      </Tip>

      <dl>
        <Row icon={Layers} tone="blue" label="Type" value={f.kind} />
        <Row icon={BookOpen} tone="green" label="Topic" value={f.topic} />
        <Row icon={BarChart3} tone="amber" label="Level" value={f.level} />
        <Row icon={Signal} tone="teal" label="How often used" value={f.frequency} />
        <Row icon={Star} tone="saffron" label="Importance" value={stars(f.importance)} />
      </dl>

      <Tip tone="amber" title="Memory Story">{f.memory_story}</Tip>
      <div className="grid grid-cols-2 gap-[0.5em]">
        <Tip tone="teal" title="Picture it">{f.visual}</Tip>
        <Tip tone="red" title="How it feels">{f.emotion}</Tip>
      </div>
      <Tip tone="navy" title="Where it comes from">{f.origin}</Tip>
      <div className="grid grid-cols-2 gap-[0.5em]">
        <Tip tone="green" title="Pro tip">{f.pro_tip}</Tip>
        <Tip tone="saffron" title="Typing hint">{f.typing_hint}</Tip>
      </div>
      <p className="text-center text-[0.62em] text-ink-muted">tap = turn over · swipe = next card · pinch = zoom</p>
    </div>
  );
}
