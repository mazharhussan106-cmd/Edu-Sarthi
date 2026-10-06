// Owns side 2 of an imported 56-point card, "Understanding & Usage": meaning,
// the code and what it prints, examples, related ideas, the real mistake with
// wrong and right code, and the real-life lines — in the same boxed layout as
// the word and chunk cards (reusing Box from the chunk card).
//
// Layout rule carried over from the word card: fields that hold sentences get
// the full width, short lists share a box two to a row. Empty fields are
// dropped by Box, so a thinner card is simply shorter. Code is shown as text
// and never run. Mini conversation and the real-life lines go on side 3's
// neighbours' side in the word card; here they close side 2, since this card
// has no separate real-life side. Sizes are `em` so the side fits one screen.

import type { ReactNode } from "react";

import { Box, Tip } from "@/components/flashcards/chunk/parts";

type F = Record<string, string>;

function Code({ v, muted }: { v?: string; muted?: boolean }) {
  if (!v) return null;
  return (
    <pre className={`overflow-x-auto whitespace-pre-wrap rounded-[0.4em] bg-paper-dim px-[0.6em] py-[0.35em] font-mono text-[0.85em] leading-snug ${muted ? "text-ink-muted" : "text-ink"}`}>
      <code>{v}</code>
    </pre>
  );
}

const text = (v?: string): ReactNode => (v ? <p className="whitespace-pre-line">{v}</p> : null);

export function RichBack({ f }: { f: F }) {
  const examples = [f.example_1, f.example_2, f.example_3].filter(Boolean);
  return (
    <div className="flex flex-col gap-[0.4em]">
      <Box
        tone="blue"
        items={[
          { tone: "blue", label: "Meaning (Simple)", body: text(f.meaning) },
          { tone: "saffron", label: "In Your Language", body: text(f.native_meaning) },
          { tone: "navy", label: "How / Why It Works", body: text(f.explanation) },
          { tone: "teal", label: "Simple Explanation", body: text(f.simple_explain) },
          { tone: "amber", label: "Like In Real Life", body: text(f.analogy) },
        ]}
      />
      <Box
        tone="navy"
        items={[
          { tone: "navy", label: "Code", body: f.code ? <><Code v={f.code} />{f.output ? <div className="mt-[0.3em]"><p className="text-[0.85em] font-bold text-ink-muted">Output</p><Code v={f.output} muted /></div> : null}</> : null },
          { tone: "blue", label: "Syntax", body: f.syntax ? <Code v={f.syntax} /> : null },
          { tone: "teal", label: "Parts", body: text(f.anatomy) },
        ]}
      />
      {examples.length ? (
        <Box tone="green" items={examples.map((e, i) => ({ tone: "green" as const, label: `Example ${i + 1}`, body: <Code v={e} /> }))} />
      ) : null}
      <Box tone="teal" items={[{ tone: "teal", label: "Variations", body: f.variation ? <Code v={f.variation} /> : null }]} />
      <Box tone="green" cols={2} items={[{ tone: "green", label: "Used With", body: text(f.used_with) }, { tone: "teal", label: "Related", body: text(f.related) }]} />
      <Box tone="navy" cols={2} items={[{ tone: "navy", label: "Other Ways", body: text(f.alternatives) }, { tone: "blue", label: "Same Family", body: text(f.word_family) }]} />
      <Box tone="blue" items={[{ tone: "green", label: "Where It's Used", body: text(f.where_used) }]} />
      <Box
        tone="saffron"
        items={[
          { tone: "saffron", label: "Common Mistake", body: text(f.misconception) },
          { tone: "red", label: "✗ Wrong", body: f.wrong_code ? <Code v={f.wrong_code} /> : null },
          { tone: "green", label: "✓ Right", body: f.right_code ? <Code v={f.right_code} /> : null },
          { tone: "saffron", label: "Don't Confuse With", body: text(f.confused_with) },
          { tone: "red", label: "Avoid", body: text(f.avoid) },
        ]}
      />
      <Box tone="amber" items={[{ tone: "amber", label: "Memory Trick", body: text(f.memory_trick) }]} />
      <Box
        tone="teal"
        items={[
          { tone: "teal", label: "In A Project", body: text(f.real_project) },
          { tone: "navy", label: "In An Interview Or Exam", body: text(f.real_interview) },
          { tone: "green", label: "In Daily Life", body: text(f.real_daily) },
        ]}
      />
      <Tip tone="teal" title="Mini Conversation">{text(f.mini_conversation)}</Tip>
      <div className="flex items-end justify-between">
        <p className="text-[0.62em] text-ink-muted">tap = turn over · pinch = zoom</p>
        <span className="rounded-tl-[0.8em] bg-saffron/25 px-[0.6em] py-[0.25em] font-display text-[0.7em] font-extrabold text-tag-saffron">PTO ↻</span>
      </div>
    </div>
  );
}
