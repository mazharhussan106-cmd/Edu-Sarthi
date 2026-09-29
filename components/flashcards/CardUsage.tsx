// Owns page 2 of a flashcard, "Understanding & Usage": meaning and examples,
// how the word is used, grammar and the common mistake, memory aids, and
// comparisons — every column of the sheet that explains the word.
//
// Sections are native <details>, open or closed by tap, with Meaning open by
// default. The page 2 design has about twenty boxes; stacked open on a phone
// that is a wall, and folded it is a table of contents.

import type { ReactNode } from "react";

import { lines, list, type WordDetails } from "@/lib/wordCard";

function Section({ title, open = false, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 font-display text-sm font-bold text-ink">
        {title}
        <span aria-hidden="true" className="text-mist transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-border px-3 py-3 text-sm">{children}</div>
    </details>
  );
}

function Field({ label, children }: { label: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <div className="mt-0.5 text-ink">{children}</div>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className="rounded-full bg-paper-dim px-2 py-0.5 text-xs text-ink">
          {i}
        </span>
      ))}
    </div>
  );
}

export function CardUsage({ d }: { d: WordDetails }) {
  const examples = [d.example_1, d.example_2, d.example_3].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-2">
      <Section title="Meaning" open>
        <Field label="Simple meaning">{d.simple_explanation}</Field>
        <Field label="Hindi meaning">{d.hindi_meaning && <span className="text-base">{d.hindi_meaning}</span>}</Field>
        {examples.length > 0 ? (
          <Field label="Examples">
            <ul className="list-disc space-y-1 pl-4">
              {examples.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </Field>
        ) : null}
      </Section>

      <Section title="Use it">
        <Field label="Collocations">{d.collocations && <Chips items={list(d.collocations)} />}</Field>
        <Field label="Phrasal / related verbs">{d.related_phrasal_verbs}</Field>
        <Field label="Where it's used">{d.where_it_s_used}</Field>
        <Field label="Action sequence">{d.action_sequence}</Field>
        {d.mini_conversation ? (
          <Field label="Mini conversation">
            <div className="rounded-lg bg-paper-dim p-2">
              {lines(d.mini_conversation).map((l) => <p key={l}>{l}</p>)}
            </div>
          </Field>
        ) : null}
      </Section>

      <Section title="Grammar & mistakes">
        <Field label="Grammar pattern">{d.grammar_pattern}</Field>
        <Field label="Word forms">{d.word_forms}</Field>
        {d.common_mistake || d.correct_version ? (
          <Field label="Common mistake">
            <p className="text-error">✗ {d.common_mistake}</p>
            <p className="text-success">✓ {d.correct_version}</p>
            {d.why_it_s_wrong ? <p className="mt-1 text-xs text-ink-muted">{d.why_it_s_wrong}</p> : null}
          </Field>
        ) : null}
      </Section>

      <Section title="Remember it">
        <Field label="Memory trick">{d.memory_trick}</Field>
        <Field label="Word family">{d.word_family}</Field>
        <Field label="Prefix / root / suffix">{d.prefix_root_suffix}</Field>
      </Section>

      <Section title="Compare & tone">
        <Field label="Synonyms">{d.synonyms && <Chips items={list(d.synonyms)} />}</Field>
        <Field label="Antonyms">{d.antonyms && <Chips items={list(d.antonyms)} />}</Field>
        {d.confusing_word ? (
          <Field label="Don't confuse">
            <p className="font-medium">{d.confusing_word}</p>
            {d.difference_explained ? <p className="text-ink-muted">{d.difference_explained}</p> : null}
          </Field>
        ) : null}
        <Field label="Related words">{d.related_words && <Chips items={list(d.related_words)} />}</Field>
        <Field label="Register & tone">{[d.register, d.tone].filter(Boolean).join(" · ") || undefined}</Field>
      </Section>
    </div>
  );
}
