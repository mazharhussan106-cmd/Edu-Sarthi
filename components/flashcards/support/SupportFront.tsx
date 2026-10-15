// Owns side 1 of a customer-support card, "Recognition", as in the approved
// mockup (docs/support-card.png): the ID with channel, level and Say it /
// Understand it badges, the situation, the sentence large, Listen and Slow,
// the recall question, then the profile rows (call stage, stress, register
// and tone, how the customer feels, level and importance) and the memory hook.
// Linking, intonation and the Indian-speaker tip are long, so they sit on
// side 3 (SupportRealLife); here they would shrink the whole side to fit.
//
// Like the word and chunk cards it deliberately shows no meaning: side 1 is a
// recall test. Every size is in `em` so CardSurface can fit the side.

import { Flag, Gauge, Heart, Mic2, Snail, Users, Volume2 } from "lucide-react";

import { Row, Tip } from "@/components/flashcards/chunk/parts";
import { channelLabel, levelLabel, type SupportDetails } from "@/lib/supportCard";
import { cn } from "@/lib/utils";

// Support lines run from five words to a long email sentence; longer ones get
// smaller type so the side still fits without scrolling.
function textSize(text: string): string {
  if (text.length <= 50) return "text-[1.6em]";
  if (text.length <= 100) return "text-[1.35em]";
  if (text.length <= 160) return "text-[1.15em]";
  return "text-[1em]";
}

const badge = "inline-block rounded-full border px-[0.55em] py-[0.05em] text-[0.62em] font-semibold";

export function SupportFront({
  code,
  text,
  channel,
  level,
  cefr,
  importance,
  d,
  onSpeak,
}: {
  code: string;
  text: string;
  channel: string | null;
  level: string | null;
  cefr: string | null;
  importance: number | null;
  d: SupportDetails;
  onSpeak: (rate?: number) => void;
}) {
  const understand = d.kind === "Understand it";
  const register = [d.register, d.tone].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="flex flex-wrap items-center gap-[0.35em]">
        <span className="inline-block rounded-[0.4em] bg-tag-navy px-[0.45em] py-[0.1em] font-display text-[0.62em] font-bold tracking-wide text-surface">
          ID {code}
        </span>
        <span className={cn(badge, "border-tag-blue/50 text-tag-blue")}>{channelLabel(channel)}</span>
        <span className={cn(badge, "border-tag-green/50 text-tag-green")}>{levelLabel(level)}</span>
        <span className={cn(badge, "border-tag-saffron/60 text-tag-saffron")}>{understand ? "👂 Understand it" : "🗣 Say it"}</span>
      </div>

      <Tip tone="saffron" title="📍 Situation" className="bg-tag-saffron/5">{d.situation}</Tip>

      <div>
        {understand ? <p className="text-[0.72em] font-bold text-tag-red">Customer says:</p> : null}
        <h2 className={cn("font-display font-extrabold leading-[1.15] text-tag-navy [overflow-wrap:anywhere]", textSize(text))}>
          {understand ? `“${text}”` : text}
        </h2>
      </div>

      <div className="flex gap-[0.4em]">
        {[
          { label: "Listen", rate: 0.9, Icon: Volume2 },
          { label: "Slow", rate: 0.6, Icon: Snail },
        ].map(({ label, rate, Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSpeak(rate)}
            aria-label={`${label}: hear the sentence${rate < 0.8 ? " slowly" : ""}`}
            className="flex items-center gap-[0.4em] rounded-full border border-border-strong py-[0.15em] pl-[0.2em] pr-[0.7em] text-ink hover:bg-hover"
          >
            <span className="grid h-[1.6em] w-[1.6em] place-items-center rounded-full border-[1.5px] border-tag-blue text-tag-blue">
              <Icon className="h-[0.9em] w-[0.9em]" aria-hidden="true" />
            </span>
            <span className="text-[0.8em]">{label}</span>
          </button>
        ))}
      </div>

      <Tip tone="blue" title="💡 Recall first — before you turn the card" className="bg-tag-blue/5">{d.recall_cue}</Tip>

      <dl className="border-t border-border">
        <Row icon={Flag} tone="teal" label="Call stage" value={d.call_stage} />
        <Row icon={Mic2} tone="blue" label="Say it like" value={d.stress} />
        <Row icon={Users} tone="green" label="Register · tone" value={register} />
        <Row icon={Heart} tone="red" label="Customer feels" value={d.customer_emotion} />
        <Row icon={Gauge} tone="saffron" label="CEFR · importance" value={[cefr, importance ? `${"★".repeat(importance)} (${importance}/5)` : null].filter(Boolean).join(" · ")} />
      </dl>

      <Tip tone="saffron" title="📖 Memory hook" className="bg-tag-saffron/5">{d.memory_hook}</Tip>

      <p className="text-center text-[0.62em] text-ink-muted">tap = turn over · swipe = next card · pinch = zoom</p>
    </div>
  );
}
