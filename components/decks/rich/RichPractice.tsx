// Owns side 3 of an imported 56-point card, "Real life & Practice": the
// multiple-choice question, fill the blank, the task in the learner's language,
// a sentence of their own, the practice question, then the review plan.
//
// Same building blocks as the word and chunk practice side (Block, Mcq,
// TypeCheck, OwnSentence, ReviewPlan). Answers are checked in the browser
// against the sheet's own answers; nothing here is scored or saved. Code in a
// question or answer is text — it is never run. This side scrolls, like the
// others, because it holds inputs.

"use client";

import { useState, type ReactNode } from "react";

import { Block, Mcq, OwnSentence, ReviewPlan, TypeCheck } from "@/components/flashcards/PracticeParts";
import { Button } from "@/components/ui/Button";

type F = Record<string, string>;

/// "A) one | B) two" or one option per line.
function options(raw: string): { key: string; text: string }[] {
  const parts = raw.split(/(?:^|\s)([A-D])\)\s*/).filter((p) => p !== "");
  const out: { key: string; text: string }[] = [];
  for (let i = 0; i + 1 < parts.length; i += 2) out.push({ key: parts[i], text: parts[i + 1].replace(/\s*\|\s*$/, "").trim() });
  return out;
}

function Reveal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="mt-2 rounded-lg border border-success/40 bg-success/10 p-2 text-xs text-ink">{children}</div>
  ) : (
    <Button size="sm" variant="ghost" className="mt-2" onClick={() => setOpen(true)}>Show answer</Button>
  );
}

const Pre = ({ v }: { v: string }) => <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-paper-dim p-2 font-mono text-xs text-ink"><code>{v}</code></pre>;

export function RichPractice({
  code, f, stage, dueLabel, backToFront,
}: { code: string; f: F; stage: number | null; dueLabel: string | null; backToFront: ReactNode }) {
  const opts = options(f.mcq_options ?? "");
  const [blank, inline] = (f.fill_blank ?? "").split("→").map((s) => s.trim());
  const answer = f.fill_answer || inline;
  let n = 0;
  return (
    <div className="flex flex-col gap-3">
      {f.mcq_question && opts.length ? (
        <Block n={++n} title="Multiple Choice" tone="text-tag-blue">
          <p className="font-medium">{f.mcq_question}</p>
          <Mcq options={opts} correct={f.mcq_answer} />
          {f.mcq_why ? <p className="mt-2 text-xs text-ink-muted">{f.mcq_why}</p> : null}
        </Block>
      ) : null}
      {blank ? (
        <Block n={++n} title="Fill in the Blank" tone="text-tag-green">
          <Pre v={blank} />
          {answer ? <TypeCheck id={`${code}-fill`} answer={answer} placeholder="Type the missing part" /> : null}
        </Block>
      ) : null}
      {f.hindi_to_task ? (
        <Block n={++n} title="Try It" tone="text-tag-saffron">
          <p>{f.hindi_to_task}</p>
          {f.task_answer ? <Reveal><Pre v={f.task_answer} /></Reveal> : null}
        </Block>
      ) : null}
      {f.practice_question ? (
        <Block n={++n} title="Practice" tone="text-tag-navy">
          <Pre v={f.practice_question} />
          {f.practice_answer ? <Reveal><Pre v={f.practice_answer} /></Reveal> : null}
        </Block>
      ) : null}
      {f.own_task ? (
        <Block n={++n} title="Write Your Own" tone="text-tag-teal">
          <p>{f.own_task}</p>
          <OwnSentence id={`${code}-own`} />
        </Block>
      ) : null}
      <ReviewPlan stage={stage} dueLabel={dueLabel} />
      {backToFront}
    </div>
  );
}
