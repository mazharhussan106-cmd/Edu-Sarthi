// Owns side 3 of a chunk card, "Practice": fill the blank, pick the chunk
// that fits the Hindi meaning, translate the Hindi example, say it in your
// own sentence, then the review plan and the two exits (video, recording).
//
// Nothing here is written by hand for each chunk. Every question is built
// from fields the chunk already has, so a question is shown only when its
// material exists: a chunk with no exact match in its example gets no
// gap-fill rather than a guessed one.

"use client";

import { Block, ExitButtons, Mcq, OwnSentence, ReviewPlan, TypeCheck } from "@/components/flashcards/PracticeParts";
import { chunkGap, type ChunkDetails } from "@/lib/chunkCard";

const KEYS = ["A", "B", "C", "D"];

// Where the right answer sits is fixed per chunk (from its code), so the
// options do not reshuffle every time the card is turned over.
function slotFor(code: string, n: number): number {
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % n;
}

export function ChunkPractice({
  code,
  text,
  d,
  distractors,
  stage,
  dueLabel,
  videoUrl,
  recordHref,
}: {
  code: string;
  text: string;
  d: ChunkDetails;
  distractors: string[];
  stage: number | null;
  dueLabel: string | null;
  videoUrl: string | null;
  recordHref: string | null;
}) {
  const gap = chunkGap(text, d);
  const meaning = d.hindi?.dev ?? d.hindi?.roman ?? null;

  const others = distractors.slice(0, 3);
  const at = slotFor(code, others.length + 1);
  const choices = [...others.slice(0, at), text, ...others.slice(at)];
  const options = choices.map((t, i) => ({ key: KEYS[i], text: t }));

  let n = 0;
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-[0.75em] font-extrabold tracking-widest text-tag-navy">PRACTICE ZONE</h3>

      {gap ? (
        <Block n={++n} title="Fill in the Blank" tone="text-tag-green">
          <p>{gap.prompt}</p>
          <TypeCheck id="chunk-gap" answer={gap.answer} placeholder="Type the missing words" />
        </Block>
      ) : null}

      {meaning && others.length >= 2 ? (
        <Block n={++n} title="Which chunk means this?" tone="text-tag-blue">
          <p className="text-base">{meaning}</p>
          {d.hindi?.dev && d.hindi.roman ? <p className="text-xs text-ink-muted">{d.hindi.roman}</p> : null}
          <Mcq options={options} correct={KEYS[at]} />
        </Block>
      ) : null}

      {d.hindi_example && d.example ? (
        <Block n={++n} title="Translate (Hindi → English)" tone="text-tag-saffron">
          <p className="text-base">{d.hindi_example.dev ?? d.hindi_example.roman}</p>
          {d.hindi_example.dev && d.hindi_example.roman ? <p className="text-xs text-ink-muted">{d.hindi_example.roman}</p> : null}
          <TypeCheck id="chunk-translate" answer={d.example} placeholder="Write it in English, using the chunk" />
        </Block>
      ) : null}

      <Block n={++n} title="Say It Your Way" tone="text-tag-teal">
        <p>
          Make one sentence of your own with <b>“{text}”</b> — about your day, your work or your studies.
        </p>
        <OwnSentence id="chunk-own" />
      </Block>

      <ReviewPlan stage={stage} dueLabel={dueLabel} />
      <ExitButtons videoUrl={videoUrl} recordHref={recordHref} />
    </div>
  );
}
