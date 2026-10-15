// Owns the "In real life" part of side 3 on a customer-support card: how to
// sound right (linking, intonation, the Indian-speaker tip), why the line
// works, other ways to say it, the mini conversation (customer and agent
// turns told apart), what to do if the customer pushes back, the Indian
// English vs international note, other channels, when not to use it, and
// the service rule behind it. Same boxes as ChunkRealLife.
//
// These are the longer fields moved off sides 1 and 2 so those fit a phone
// screen at a readable size; this side scrolls.
//
// It deliberately holds no practice; SupportPractice follows it on the same
// side. Plain markup, no state.

import type { ReactNode } from "react";

import { conversation, type SupportDetails } from "@/lib/supportCard";
import { cn } from "@/lib/utils";

function Item({ title, tone, children }: { title: string; tone: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <p className={cn("font-display text-[0.8em] font-bold", tone)}>{title}</p>
      <div className="mt-0.5 text-sm text-ink">{children}</div>
    </div>
  );
}

export function SupportRealLife({ d }: { d: SupportDetails }) {
  const talk = conversation(d.mini_conversation);
  const sound = [
    { label: "Linking", text: d.linking },
    { label: "Intonation & pace", text: d.intonation },
    { label: "Indian speaker tip", text: d.indian_pron_tip },
  ].filter((x) => x.text);
  const alts = [d.alt_1, d.alt_2].filter(Boolean) as string[];
  const notes = [
    { title: "🤔 If the customer pushes back", tone: "text-tag-red", text: d.if_customer_pushes },
    { title: "🌍 Indian English vs international", tone: "text-tag-blue", text: d.cultural_note },
    { title: "📞 On other channels", tone: "text-tag-teal", text: d.channel_note },
    { title: "🚫 When not to use it", tone: "text-tag-red", text: d.when_not_to_use },
    { title: "📏 Best-practice rule", tone: "text-tag-saffron", text: d.source_rule },
  ].filter((x) => x.text);

  if (!talk.length && !notes.length && !sound.length) return null;

  return (
    <section aria-labelledby="support-real-life" className="flex flex-col gap-2">
      <h3 id="support-real-life" className="font-display text-[0.75em] font-extrabold tracking-widest text-tag-navy">
        IN REAL LIFE
      </h3>
      {sound.length ? (
        <Item title="🎙 Sound right" tone="text-tag-blue">
          {sound.map((x) => (
            <p key={x.label} className="mt-1 first:mt-0">
              <b className="text-tag-blue">{x.label}:</b> {x.text}
            </p>
          ))}
        </Item>
      ) : null}
      {d.why_it_works ? (
        <Item title="✅ Why it works" tone="text-tag-green">
          {d.why_it_works}
        </Item>
      ) : null}
      {alts.length || d.more_formal ? (
        <Item title="🔁 Other ways to say it" tone="text-tag-teal">
          {alts.length ? (
            <ul className="list-disc pl-5">
              {alts.map((a) => <li key={a}>{a}</li>)}
            </ul>
          ) : null}
          {d.more_formal ? (
            <p className="mt-1">
              <b className="text-tag-navy">More formal:</b> {d.more_formal}
            </p>
          ) : null}
        </Item>
      ) : null}
      {talk.length ? (
        <Item title="🗣 Mini conversation" tone="text-tag-teal">
          {talk.map((t, i) => (
            <p key={i}>
              <b className={t.who === "Agent" ? "text-tag-navy" : "text-tag-red"}>{t.who}:</b> {t.line}
            </p>
          ))}
        </Item>
      ) : null}
      {notes.map((x) => (
        <Item key={x.title} title={x.title} tone={x.tone}>
          {x.text}
        </Item>
      ))}
    </section>
  );
}
