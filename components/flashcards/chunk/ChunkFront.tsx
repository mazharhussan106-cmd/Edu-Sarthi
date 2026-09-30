// Owns side 1 of a chunk card, "Recognition": the chunk itself with a listen
// button, what kind of chunk it is, where it sits in the student's path, and
// when people say it. Like the word card's front, it deliberately shows no
// meaning, so side 1 is a recall test.
//
// Every size is in `em` so CardSurface can fit the side to one screen.

import { BookOpen, Layers, Link2, Route, Tag, TextCursorInput, Volume2, type LucideIcon } from "lucide-react";

import { chunkTypeLabel, type ChunkDetails, type ChunkPath } from "@/lib/chunkCard";
import { cn } from "@/lib/utils";

type Tone = "blue" | "saffron" | "green" | "red" | "teal" | "amber" | "navy";

const TEXT: Record<Tone, string> = {
  blue: "text-tag-blue", saffron: "text-tag-saffron", green: "text-tag-green", red: "text-tag-red",
  teal: "text-tag-teal", amber: "text-tag-amber", navy: "text-tag-navy",
};
const TINT: Record<Tone, string> = {
  blue: "bg-tag-blue/15", saffron: "bg-tag-saffron/15", green: "bg-tag-green/15", red: "bg-tag-red/15",
  teal: "bg-tag-teal/15", amber: "bg-tag-amber/15", navy: "bg-tag-navy/15",
};

function Row({ icon: Icon, tone, label, value }: { icon: LucideIcon; tone: Tone; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[1.6em_7em_minmax(0,1fr)] items-center gap-[0.5em] border-b border-dashed border-border py-[0.35em] last:border-0">
      <span className={cn("grid h-[1.5em] w-[1.5em] place-items-center rounded-[0.35em]", TINT[tone], TEXT[tone])}>
        <Icon className="h-[0.9em] w-[0.9em]" aria-hidden="true" />
      </span>
      <dt className={cn("text-[0.8em] font-bold", TEXT[tone])}>{label}</dt>
      <dd className="text-[0.8em] text-ink">{value}</dd>
    </div>
  );
}

// Chunks run from two words to a full sentence; longer ones get smaller type
// so they stay readable without the card scrolling.
function textSize(text: string): string {
  if (text.length <= 14) return "text-[2.2em]";
  if (text.length <= 26) return "text-[1.7em]";
  if (text.length <= 44) return "text-[1.35em]";
  return "text-[1.15em]";
}

export function ChunkFront({
  code,
  text,
  type,
  level,
  lewisType,
  d,
  path,
  onSpeak,
}: {
  code: string;
  text: string;
  type: string | null;
  level: string | null;
  lewisType: string | null;
  d: ChunkDetails;
  path: ChunkPath;
  onSpeak: () => void;
}) {
  const stage = (path === "B" ? d.path_b : d.path_a)?.stage ?? null;

  return (
    <div className="flex flex-col gap-[0.6em]">
      <div className="flex flex-wrap items-center gap-[0.4em]">
        <span className="rounded-[0.4em] bg-tag-navy px-[0.45em] py-[0.1em] font-display text-[0.62em] font-bold tracking-wide text-surface">
          CHUNK ID {code}
        </span>
        <span className="rounded-full border border-tag-blue/40 px-[0.6em] py-[0.05em] text-[0.68em] font-semibold text-tag-blue">
          {chunkTypeLabel(type)}
        </span>
        {level ? (
          <span className="rounded-full border border-tag-saffron/40 px-[0.6em] py-[0.05em] text-[0.68em] font-semibold text-tag-saffron">
            {level}
          </span>
        ) : null}
      </div>

      <h2 className={cn("font-display font-extrabold leading-[1.15] text-tag-navy [overflow-wrap:anywhere]", textSize(text))}>{text}</h2>

      <button
        type="button"
        onClick={onSpeak}
        aria-label={`Hear “${text}”`}
        className="flex w-fit items-center gap-[0.4em] rounded-full border border-border-strong py-[0.2em] pl-[0.25em] pr-[0.8em] text-ink hover:bg-hover"
      >
        <span className="grid h-[1.7em] w-[1.7em] place-items-center rounded-full border-[1.5px] border-tag-blue text-tag-blue">
          <Volume2 className="h-[0.95em] w-[0.95em]" aria-hidden="true" />
        </span>
        <span className="text-[0.85em] font-medium">Listen</span>
      </button>

      {d.when ? (
        <div className="rounded-[0.6em] border border-tag-blue/30 bg-tag-blue/5 px-[0.7em] py-[0.45em]">
          <p className="text-[0.72em] font-bold text-tag-blue">💡 When to use</p>
          <p className="text-[0.85em] leading-snug text-ink">{d.when}</p>
        </div>
      ) : null}

      <dl className="border-t border-border">
        <Row icon={Layers} tone="teal" label="Group" value={d.group} />
        <Row icon={Tag} tone="saffron" label="Topic" value={d.topic} />
        <Row icon={TextCursorInput} tone="green" label="Fill ___ with" value={d.slot} />
        <Row icon={Link2} tone="red" label="Preposition" value={d.preposition} />
        <Row icon={Route} tone="navy" label={`Path ${path}`} value={stage} />
        <Row icon={BookOpen} tone="amber" label="Chunk kind" value={lewisType} />
      </dl>

      <p className="text-center text-[0.62em] text-ink-muted">tap = turn over · swipe = next card · pinch = zoom</p>
    </div>
  );
}
