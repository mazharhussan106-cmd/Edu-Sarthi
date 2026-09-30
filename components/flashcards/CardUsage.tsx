// Owns side 2 of a flashcard, "Understanding & Usage", in the reference
// card's style: white boxes, coloured headings, nothing filled in.
//
// Layout rule: a field that holds sentences (meaning, examples, the common
// mistake, grammar pattern, memory trick, the confusing-word explanation)
// gets the full width. Fields that are short lists (synonyms and antonyms,
// word family and related words, where it's used and tone) share a box two
// to a row. Giving every field an equal cell, as a grid does, makes the
// sentences unreadable and leaves the lists half empty.
//
// It deliberately leaves out mini conversation, action sequence, emotion and
// visual association: they did not fit and moved to side 3 with the other
// real-life material. All sizes are `em` so CardSurface can fit the side.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { list, type WordDetails } from "@/lib/wordCard";

type Tone = "blue" | "saffron" | "green" | "red" | "teal" | "amber" | "navy";

const TEXT: Record<Tone, string> = {
  blue: "text-tag-blue", saffron: "text-tag-saffron", green: "text-tag-green", red: "text-tag-red",
  teal: "text-tag-teal", amber: "text-tag-amber", navy: "text-tag-navy",
};
const EDGE: Record<Tone, string> = {
  blue: "border-tag-blue/35", saffron: "border-tag-saffron/35", green: "border-tag-green/35", red: "border-tag-red/35",
  teal: "border-tag-teal/35", amber: "border-tag-amber/35", navy: "border-tag-navy/35",
};

function Box({ tone, children, cols = 1 }: { tone: Tone; children: ReactNode; cols?: 1 | 2 }) {
  return (
    <div
      className={cn(
        "rounded-[0.6em] border-[1.3px]",
        EDGE[tone],
        cols === 2
          ? "grid grid-cols-2 [&>*+*]:border-l [&>*+*]:border-border"
          : "[&>*+*]:border-t [&>*+*]:border-dashed [&>*+*]:border-border",
      )}
    >
      {children}
    </div>
  );
}

function Field({ tone, label, children }: { tone: Tone; label: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className="px-[0.6em] py-[0.35em]">
      <p className={cn("text-[0.72em] font-bold", TEXT[tone])}>{label}</p>
      <div className="text-[0.78em] leading-snug text-ink">{children}</div>
    </div>
  );
}

// Inline with dots rather than bullets: a bullet per item spends a whole line
// on "grasp", and every line spent shrinks the whole side's type.
function Items({ raw }: { raw?: string }) {
  const items = list(raw);
  if (items.length === 0) return null;
  return <p>{items.join(" · ")}</p>;
}

export function CardUsage({ d }: { d: WordDetails }) {
  const examples = [d.example_1, d.example_2, d.example_3].filter(Boolean) as string[];
  const tone = [d.register && `Register: ${d.register}`, d.tone && `Tone: ${d.tone}`].filter(Boolean);

  return (
    <div className="flex flex-col gap-[0.4em]">
      <Box tone="blue">
        <Field tone="blue" label="Meaning (Simple)">{d.simple_explanation}</Field>
        <Field tone="saffron" label="Hindi Meaning">{d.hindi_meaning}</Field>
        {examples.length ? (
          <Field tone="navy" label="Example Sentences">
            <ul className="list-disc pl-[1.1em]">
              {examples.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </Field>
        ) : null}
      </Box>

      {d.common_mistake || d.grammar_pattern || d.word_forms ? (
        <Box tone="saffron">
          {d.common_mistake || d.correct_version ? (
            <Field tone="saffron" label="Common Mistake">
              {d.common_mistake ? <p><span className="font-bold text-error">✗</span> {d.common_mistake}</p> : null}
              {d.correct_version ? <p><span className="font-bold text-success">✓</span> {d.correct_version}</p> : null}
              {d.why_it_s_wrong ? <p className="text-ink-muted">{d.why_it_s_wrong}</p> : null}
            </Field>
          ) : null}
          <Field tone="blue" label="Grammar Pattern">{d.grammar_pattern}</Field>
          <Field tone="green" label="Word Forms">{d.word_forms}</Field>
        </Box>
      ) : null}

      <Box tone="green" cols={2}>
        <Field tone="green" label="Synonyms"><Items raw={d.synonyms} /></Field>
        <Field tone="red" label="Antonyms"><Items raw={d.antonyms} /></Field>
      </Box>

      {d.collocations || d.related_phrasal_verbs ? (
        <Box tone="teal">
          <Field tone="teal" label="Collocations">{d.collocations}</Field>
          <Field tone="red" label="Phrasal / Related Verbs">{d.related_phrasal_verbs}</Field>
        </Box>
      ) : null}

      <Box tone="navy" cols={2}>
        <Field tone="navy" label="Word Family"><Items raw={d.word_family} /></Field>
        <Field tone="teal" label="Related Words"><Items raw={d.related_words} /></Field>
      </Box>

      <Box tone="amber">
        {d.confusing_word ? (
          <Field tone="saffron" label="Confusing Words">
            <p className="font-semibold">{d.confusing_word}</p>
            {d.difference_explained ? <p>{d.difference_explained}</p> : null}
          </Field>
        ) : null}
        <Field tone="amber" label="Memory Trick">{d.memory_trick}</Field>
        <Field tone="teal" label="Prefix / Root / Suffix">{d.prefix_root_suffix}</Field>
      </Box>

      <Box tone="blue" cols={2}>
        <Field tone="green" label="Where It’s Used"><Items raw={d.where_it_s_used} /></Field>
        <Field tone="blue" label="Register & Tone">{tone.length ? tone.map((t) => <p key={t}>{t}</p>) : null}</Field>
      </Box>

      <div className="flex items-end justify-between">
        <p className="text-[0.62em] text-ink-muted">tap = turn over · pinch = zoom</p>
        {/* "Please turn over": the owner asked for a visible sign that a
            third side follows. */}
        <span className="rounded-tl-[0.8em] bg-saffron/25 px-[0.6em] py-[0.25em] font-display text-[0.7em] font-extrabold text-tag-saffron">
          PTO ↻
        </span>
      </div>
    </div>
  );
}
