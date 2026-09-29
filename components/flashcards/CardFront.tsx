// Owns page 1 of a flashcard, "Recognition": picture, the word, how to say it
// (IPA, syllables, Indian pronunciation, a speak button), its profile (part of
// speech, category, CEFR, frequency, importance, register, origin) and the
// three quick tips.
//
// The picture slot is always drawn, with a placeholder until an image URL is
// set in the admin, so the layout does not jump when images arrive.

import { ImageIcon, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { WordDetails } from "@/lib/wordCard";

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-2 border-b border-border py-1.5 text-sm last:border-0">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function Tip({ title, text }: { title: string; text?: string }) {
  if (!text) return null;
  return (
    <div className="rounded-lg bg-paper-dim p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{title}</p>
      <p className="mt-0.5 text-sm text-ink">{text}</p>
    </div>
  );
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
  const stars = meta.importance ? "★".repeat(meta.importance) + "☆".repeat(Math.max(0, 5 - meta.importance)) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex aspect-square w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper-dim">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={`Picture for ${text}`} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-mist" aria-label="Picture coming soon" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] text-mist">{code}</p>
          {/* Sized by length so "procrastination" fits on one line instead of
              breaking mid-word; very long phrases still wrap between words. */}
          <h2
            className={cn(
              "font-display font-bold uppercase leading-tight text-ink [overflow-wrap:anywhere]",
              text.length <= 8 ? "text-3xl" : text.length <= 12 ? "text-2xl" : "text-xl",
            )}
          >
            {text}
          </h2>
          <button
            type="button"
            onClick={onSpeak}
            className="mt-1 inline-flex items-center gap-2 rounded-full border border-border-strong px-3 py-1 text-sm text-ink hover:bg-hover"
            aria-label={`Hear how to say ${text}`}
          >
            <Volume2 className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="font-mono">{d.ipa ?? "Listen"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border p-2.5">
          <p className="text-[11px] font-medium text-ink-muted">Syllable break</p>
          <p className="mt-0.5 font-medium text-ink">{d.syllable_break ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-border p-2.5">
          <p className="text-[11px] font-medium text-ink-muted">Indian pronunciation</p>
          <p className="mt-0.5 font-medium text-ink">{d.hindi_pronunciation ?? "—"}</p>
        </div>
      </div>

      <dl className="rounded-lg border border-border px-3">
        <Row label="Part of speech" value={meta.partOfSpeech} />
        <Row label="Category" value={meta.category} />
        <Row label="CEFR level" value={meta.cefr} />
        <Row label="Frequency" value={d.frequency} />
        <Row label="Importance" value={stars ? `${stars} (${meta.importance}/5)` : null} />
        <Row label="Register" value={d.register} />
        <Row label="Origin" value={d.etymology} />
      </dl>

      <Tip title="Quick tip" text={d.usage_tip} />
      <div className="grid gap-2 sm:grid-cols-3">
        <Tip title="Pronunciation" text={d.pronunciation_tip} />
        <Tip title="Spelling" text={d.spelling_tip} />
        <Tip title="Mnemonic" text={d.mnemonic} />
      </div>
    </div>
  );
}
