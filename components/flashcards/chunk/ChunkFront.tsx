// Owns side 1 of a chunk or grammar card, "Recognition", laid out like the
// word card's front: picture beside the ID, the chunk and its sound (IPA with
// a speak button), linking and Indian pronunciation, the profile rows with a
// coloured icon each, then when to use it, the pronunciation tip beside when
// NOT to use it, and the memory trick.
//
// Like the word card it deliberately shows no meaning: side 1 is a recall
// test. Every size is in `em` so CardSurface can fit the side to one screen.

import { BarChart3, BookOpen, ImageIcon, Layers, Link2, Mic2, Tag, TextCursorInput, Users, Volume2 } from "lucide-react";
import type { ReactNode } from "react";

import { Row, Tip } from "@/components/flashcards/chunk/parts";
import { chunkTypeLabel, type ChunkDetails } from "@/lib/chunkCard";
import { cn } from "@/lib/utils";

const CEFR: Record<string, string> = { A1: "A1 (Beginner)", A2: "A2 (Elementary)", B1: "B1 (Intermediate)", B2: "B2 (Upper-intermediate)" };

// Chunks run from two words to a full sentence; longer ones get smaller type
// so they stay readable without the side scrolling.
function textSize(text: string): string {
  if (text.length <= 14) return "text-[1.9em]";
  if (text.length <= 26) return "text-[1.5em]";
  if (text.length <= 44) return "text-[1.25em]";
  return "text-[1.1em]";
}

// The gap answer ("again" in "Sorry, could you say that again?") is
// underlined, so the eye goes to the part learners most often get wrong.
// Whole words only, and only where it appears exactly; otherwise plain text.
function marked(text: string, answer: string | null | undefined): ReactNode {
  if (!answer || answer.length >= text.length) return text;
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`(^|[^\\p{L}'])(${escaped})(?=$|[^\\p{L}'])`, "iu").exec(text);
  if (!m) return text;
  const at = m.index + m[1].length;
  return (
    <>
      {text.slice(0, at)}
      <span className="underline decoration-saffron decoration-[3px] underline-offset-[3px]">{m[2]}</span>
      {text.slice(at + m[2].length)}
    </>
  );
}

export function ChunkFront({
  code,
  text,
  grammar,
  type,
  level,
  lewisType,
  d,
  imageUrl,
  onSpeak,
}: {
  code: string;
  text: string;
  /** A Grammar-tab card: its group is the grammar topic, so no type row. */
  grammar: boolean;
  type: string | null;
  level: string | null;
  lewisType: string | null;
  d: ChunkDetails;
  imageUrl: string | null;
  onSpeak: () => void;
}) {
  const register = [d.register, d.tone && d.tone !== d.register ? d.tone.toLowerCase() : null].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="flex gap-[0.6em]">
        <div className="flex aspect-[8/7] w-[36%] shrink-0 items-center justify-center overflow-hidden rounded-[0.7em] border border-dashed border-border-strong bg-paper-dim">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={`Picture for ${text}`} className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-[0.2em] text-mist">
              <ImageIcon className="h-[2em] w-[2em]" aria-hidden="true" />
              <span className="text-[0.6em]">Picture coming</span>
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-[0.4em] bg-tag-navy px-[0.45em] py-[0.1em] font-display text-[0.62em] font-bold tracking-wide text-surface">
            {grammar ? "GRAMMAR" : "CHUNK"} ID {code}
          </span>
          <h2 className={cn("mt-[0.15em] font-display font-extrabold leading-[1.12] text-tag-navy [overflow-wrap:anywhere]", textSize(text))}>
            {marked(text, d.gap?.a)}
          </h2>
          <p className="mt-[0.3em] text-[0.7em] font-bold text-tag-blue">Pronunciation (IPA)</p>
          <button
            type="button"
            onClick={onSpeak}
            aria-label={`Hear “${text}”`}
            className="mt-[0.15em] flex max-w-full items-center gap-[0.4em] rounded-full border border-border-strong py-[0.15em] pl-[0.2em] pr-[0.6em] text-left text-ink hover:bg-hover"
          >
            <span className="grid h-[1.6em] w-[1.6em] shrink-0 place-items-center rounded-full border-[1.5px] border-tag-blue text-tag-blue">
              <Volume2 className="h-[0.9em] w-[0.9em]" aria-hidden="true" />
            </span>
            <span className="min-w-0 font-mono text-[0.78em] [overflow-wrap:anywhere]">{d.ipa ?? "Listen"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[0.4em]">
        <Tip tone="blue" title="Linking (Connected Speech)">{d.linking ?? "—"}</Tip>
        <Tip tone="blue" title="Indian Pronunciation">{d.hi_pron ?? "—"}</Tip>
      </div>

      <dl className="border-t border-border">
        {grammar ? null : <Row icon={BookOpen} tone="navy" label="Chunk Type" value={chunkTypeLabel(type)} />}
        <Row icon={Layers} tone="teal" label={grammar ? "Grammar Topic" : "Group"} value={d.group} />
        <Row icon={BarChart3} tone="saffron" label="CEFR Level" value={level ? CEFR[level] ?? level : null} />
        <Row icon={BookOpen} tone="blue" label="Chunk Kind" value={lewisType} />
        <Row icon={Mic2} tone="amber" label="Stress" value={d.stress} />
        <Row icon={Users} tone="red" label="Register" value={register} />
        <Row icon={Tag} tone="green" label="Topic" value={d.topic} />
        <Row icon={TextCursorInput} tone="green" label="Fill ___ with" value={d.slot} />
        <Row icon={Link2} tone="red" label="Preposition" value={d.preposition} />
      </dl>

      <Tip tone="blue" title="💡 When to use" className="bg-tag-blue/5">{d.when}</Tip>
      <div className="grid grid-cols-2 gap-[0.4em]">
        <Tip tone="blue" title="Pronunciation Tip">{d.pron_tip}</Tip>
        <Tip tone="red" title="When NOT to use">{d.not_when}</Tip>
      </div>
      <Tip tone="saffron" title="📖 Memory Trick" className="bg-tag-saffron/5">{d.memory}</Tip>

      <p className="text-center text-[0.62em] text-ink-muted">tap = turn over · swipe = next card · pinch = zoom</p>
    </div>
  );
}
