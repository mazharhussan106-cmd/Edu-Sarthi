// Owns the three sides of a 56-point card as screen sections: Recognition
// (what you see first), Understanding, and Practice. Each skips any field the
// card does not have, so a thinner card is shorter rather than broken.
//
// It deliberately holds no tab state (RichCard) and never runs code — code is
// text in a <pre>. Answers stay hidden behind a "Show answer" button until the
// learner asks, which is the point of the practice side.

"use client";

import { useState, type ReactNode } from "react";

import { CardMarkdown } from "@/components/decks/CardMarkdown";

type F = Record<string, string>;

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <div className="mt-0.5 text-sm text-ink">{children}</div>
    </div>
  );
}

const Text = ({ label, v }: { label: string; v?: string }) => (v ? <Block label={label}><p className="whitespace-pre-line">{v}</p></Block> : null);
const Code = ({ label, v, muted }: { label: string; v?: string; muted?: boolean }) =>
  v ? (
    <Block label={label}>
      <pre className={`overflow-x-auto rounded-lg bg-paper-dim p-3 font-mono text-xs ${muted ? "text-ink-muted" : "text-ink"}`}><code>{v}</code></pre>
    </Block>
  ) : null;

function Reveal({ label = "Show answer", children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="mt-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-ink">{children}</div>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="mt-2 h-9 rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover">{label}</button>
  );
}

const stars = (n: string) => (/^[1-5]$/.test(n) ? "★".repeat(Number(n)) + "☆".repeat(5 - Number(n)) : "");

/// The older Python layout has no "Recall cue" column, only a reverse prompt
/// that ends "(Answer: …)". Side 1 must never show the answer, so that tail is
/// cut off and the rest is used as the cue.
function cueOf(f: F): string {
  if (f.cue) return f.cue;
  const reverse = (f.quick_recall ?? "").replace(/\s*\(\s*answer\s*:[^)]*\)?\s*$/i, "").trim();
  return reverse || "Before you turn the card: what is it, and when would you use it?";
}

export function Side1({ f }: { f: F }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <p className="font-display text-2xl font-bold text-ink">{f.term}</p>
        {f.pronunciation ? <p className="mt-0.5 text-sm text-ink-muted">{f.pronunciation}</p> : null}
        <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 text-xs text-ink-muted">
          {f.kind ? <span>{f.kind}</span> : null}
          {f.frequency ? <span>Used: {f.frequency}</span> : null}
          {f.importance ? <span aria-label={`Importance ${f.importance} of 5`} className="text-saffron">{stars(f.importance)}</span> : null}
        </p>
      </div>
      <div className="rounded-lg bg-paper-dim p-3 text-center text-sm font-medium text-ink">
        {cueOf(f)}
      </div>
      <Text label="Memory story" v={f.memory_story} />
      <Text label="Picture it" v={f.visual} />
      <Text label="How it feels" v={f.emotion} />
      <Text label="Where it comes from" v={f.origin} />
      <Text label="Pro tip" v={f.pro_tip} />
      <Text label="Typing hint" v={f.typing_hint} />
    </div>
  );
}

export function Side2({ f }: { f: F }) {
  const ex = [f.example_1, f.example_2, f.example_3].filter(Boolean);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-medium text-ink">{f.meaning}</p>
      <Text label="In your language" v={f.native_meaning} />
      <Code label="Code" v={f.code} />
      <Code label="Output" v={f.output} muted />
      <Text label="Explanation" v={f.explanation} />
      <Text label="Simple explanation" v={f.simple_explain} />
      <Text label="Like in real life" v={f.analogy} />
      <Code label="Syntax" v={f.syntax} />
      <Text label="Parts" v={f.anatomy} />
      {ex.map((e, i) => <Code key={i} label={`Example ${i + 1}`} v={e} />)}
      <Code label="Variations" v={f.variation} />
      <Text label="Used with" v={f.used_with} />
      <Text label="Related" v={f.related} />
      <Text label="Other ways" v={f.alternatives} />
      <Text label="Same family" v={f.word_family} />
      <Text label="Where it is used" v={f.where_used} />
      <Text label="Mini conversation" v={f.mini_conversation} />
      <Text label="Common mistake" v={f.misconception} />
      <Text label="Don’t confuse with" v={f.confused_with} />
      <Text label="Avoid" v={f.avoid} />
      {f.wrong_code || f.right_code ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Code label="✗ Wrong" v={f.wrong_code} />
          <Code label="✓ Right" v={f.right_code} />
        </div>
      ) : null}
      <Text label="Memory trick" v={f.memory_trick} />
      <Text label="In a project" v={f.real_project} />
      <Text label="In an interview or exam" v={f.real_interview} />
      <Text label="In daily life" v={f.real_daily} />
    </div>
  );
}

/// "A) one | B) two" or one option per line → ["one","two",…].
function options(raw: string): { key: string; text: string }[] {
  const parts = raw.split(/(?:^|\s)([A-D])\)\s*/).filter((p) => p !== "");
  const out: { key: string; text: string }[] = [];
  for (let i = 0; i + 1 < parts.length; i += 2) out.push({ key: parts[i], text: parts[i + 1].replace(/\s*\|\s*$/, "").trim() });
  return out;
}

export function Side3({ f }: { f: F }) {
  const opts = options(f.mcq_options ?? "");
  const [fillQ, fillInline] = (f.fill_blank ?? "").split("→").map((s) => s.trim());
  const fillA = f.fill_answer || fillInline;
  return (
    <div className="flex flex-col gap-5">
      {f.mcq_question ? (
        <div>
          <Block label="Pick the right answer"><p>{f.mcq_question}</p></Block>
          <ul className="mt-2 flex flex-col gap-1.5">
            {opts.map((o) => (
              <li key={o.key} className="flex gap-2 rounded-lg border border-border px-3 py-2 text-sm text-ink">
                <b className="font-mono">{o.key}</b>
                <span className="whitespace-pre-line">{o.text}</span>
              </li>
            ))}
          </ul>
          <Reveal><b>{f.mcq_answer}</b>{f.mcq_why ? ` — ${f.mcq_why}` : ""}</Reveal>
        </div>
      ) : null}
      {fillQ ? (
        <div>
          <Block label="Fill the blank"><pre className="overflow-x-auto rounded-lg bg-paper-dim p-3 font-mono text-xs text-ink"><code>{fillQ}</code></pre></Block>
          {fillA ? <Reveal><code className="font-mono">{fillA}</code></Reveal> : null}
        </div>
      ) : null}
      {f.hindi_to_task ? (
        <div>
          <Block label="Try it"><p>{f.hindi_to_task}</p></Block>
          {f.task_answer ? <Reveal><pre className="overflow-x-auto font-mono text-xs"><code>{f.task_answer}</code></pre></Reveal> : null}
        </div>
      ) : null}
      <Text label="Write your own" v={f.own_task} />
      {f.practice_question ? (
        <div>
          <Block label="Practice"><pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-paper-dim p-3 font-mono text-xs text-ink"><code>{f.practice_question}</code></pre></Block>
          {f.practice_answer ? <Reveal><pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs"><code>{f.practice_answer}</code></pre></Reveal> : null}
        </div>
      ) : null}
    </div>
  );
}
