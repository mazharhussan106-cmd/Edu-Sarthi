// Owns side 1 of a flashcard, "Recognition", laid out like the reference
// card: picture beside the word and its sound (ID, IPA, speak button), the
// syllable break and Indian pronunciation, the word's profile rows with a
// coloured icon each, then the quick tip, the pronunciation and spelling tips
// side by side, and the mnemonic story on its own line.
//
// Every size is in `em` so CardSurface can scale the whole side to fit one
// screen. It deliberately shows no meaning: side 1 is for recalling it.
// No "PTO" corner here either, at the owner's request; the hint line says
// how to turn.

import { BarChart3, BookOpen, Globe2, ImageIcon, Layers, Signal, Star, Users, Volume2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { WordDetails } from "@/lib/wordCard";

type Tone = "blue" | "saffron" | "green" | "red" | "teal" | "amber" | "navy";

// Literal class names, so Tailwind sees every one at build time.
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
    <div className="grid grid-cols-[1.6em_7.6em_minmax(0,1fr)] items-center gap-[0.5em] border-b border-dashed border-border py-[0.28em] last:border-0">
      <span className={cn("grid h-[1.5em] w-[1.5em] place-items-center rounded-[0.35em]", TINT[tone], TEXT[tone])}>
        <Icon className="h-[0.9em] w-[0.9em]" aria-hidden="true" />
      </span>
      <dt className={cn("text-[0.8em] font-bold", TEXT[tone])}>{label}</dt>
      <dd className="text-[0.8em] text-ink">{value}</dd>
    </div>
  );
}

function Tip({ tone, title, text, className }: { tone: Tone; title: string; text?: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={cn("rounded-[0.6em] border border-border px-[0.6em] py-[0.4em]", className)}>
      <p className={cn("text-[0.72em] font-bold", TEXT[tone])}>{title}</p>
      <p className="text-[0.78em] leading-snug text-ink">{text}</p>
    </div>
  );
}

// Long words get smaller type so they stay on one line where possible.
function wordSize(text: string): string {
  if (text.length <= 7) return "text-[2.3em]";
  if (text.length <= 10) return "text-[1.9em]";
  if (text.length <= 14) return "text-[1.5em]";
  return "text-[1.25em]";
}

export function CardFront({
  code,
  text,
  d,
  imageUrl,
  onSpeak,
  meta,
}: {
  code: string;
  text: string;
  d: WordDetails;
  imageUrl: string | null;
  onSpeak: () => void;
  meta: { partOfSpeech: string | null; category: string | null; cefr: string | null; importance: number | null };
}) {
  const stars = meta.importance ? `${"★".repeat(meta.importance)}${"☆".repeat(Math.max(0, 5 - meta.importance))} (${meta.importance}/5)` : null;

  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="flex gap-[0.6em]">
        <div className="flex aspect-[8/7] w-[38%] shrink-0 items-center justify-center overflow-hidden rounded-[0.7em] border border-dashed border-border-strong bg-paper-dim">
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
            WORD ID {code}
          </span>
          <h2 className={cn("mt-[0.15em] font-display font-extrabold uppercase leading-[1.05] text-tag-navy [overflow-wrap:anywhere]", wordSize(text))}>
            {text}
          </h2>
          <p className="mt-[0.3em] text-[0.7em] font-bold text-tag-blue">Pronunciation (IPA)</p>
          <button
            type="button"
            onClick={onSpeak}
            aria-label={`Hear how to say ${text}`}
            className="mt-[0.15em] flex items-center gap-[0.4em] rounded-full border border-border-strong py-[0.15em] pl-[0.2em] pr-[0.6em] text-ink hover:bg-hover"
          >
            <span className="grid h-[1.6em] w-[1.6em] place-items-center rounded-full border-[1.5px] border-tag-blue text-tag-blue">
              <Volume2 className="h-[0.9em] w-[0.9em]" aria-hidden="true" />
            </span>
            <span className="text-[0.85em]">{d.ipa ?? "Listen"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[0.4em]">
        <Tip tone="blue" title="Syllable Break" text={d.syllable_break ?? "—"} />
        <Tip tone="blue" title="Indian Pronunciation" text={d.hindi_pronunciation ?? "—"} />
      </div>

      <dl className="border-t border-border">
        <Row icon={BookOpen} tone="navy" label="Part of Speech" value={meta.partOfSpeech} />
        <Row icon={Layers} tone="teal" label="Category" value={meta.category} />
        <Row icon={BarChart3} tone="saffron" label="CEFR Level" value={meta.cefr} />
        <Row icon={Signal} tone="blue" label="Frequency" value={d.frequency} />
        <Row icon={Star} tone="amber" label="Importance (1–5)" value={stars} />
        <Row icon={Users} tone="red" label="Register" value={d.register} />
        <Row icon={Globe2} tone="green" label="Etymology (Origin)" value={d.etymology} />
      </dl>

      <Tip tone="blue" title="💡 Quick Tip" text={d.usage_tip} className="bg-tag-blue/5" />
      <div className="grid grid-cols-2 gap-[0.4em]">
        <Tip tone="blue" title="Pronunciation Tip" text={d.pronunciation_tip} />
        <Tip tone="green" title="Spelling Tip" text={d.spelling_tip} />
      </div>
      <Tip tone="saffron" title="📖 Mnemonic Story" text={d.mnemonic} className="bg-tag-saffron/5" />

      <p className="text-center text-[0.62em] text-ink-muted">tap = turn over · swipe = next card · pinch = zoom</p>
    </div>
  );
}
