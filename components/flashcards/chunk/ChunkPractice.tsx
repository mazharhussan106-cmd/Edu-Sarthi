// Owns the practice half of side 3 on a chunk or grammar card: fill the
// blank, pick the chunk that fits the Hindi meaning, pick the right reply,
// recall the chunk from the Hindi, translate the Hindi example, then the
// speaking task for the teacher's audit, the review plan, and the two exits
// (video, recording). Real-life examples come before this, from
// ChunkRealLife.
//
// Nothing here is written by hand for each card. Every question is built
// from fields the card already has, so a question is shown only when its
// material exists: a chunk with no exact match in its example gets no
// gap-fill rather than a guessed one.

"use client";

import { useState } from "react";

import { Block, ExitButtons, Mcq, OwnSentence, ReviewPlan, TypeCheck } from "@/components/flashcards/PracticeParts";
import { chunkGap, type ChunkDetails } from "@/lib/chunkCard";

const KEYS = ["A", "B", "C", "D"];

// Where the right answer sits is fixed per card (from its code), so the
// options do not reshuffle every time the card is turned over.
function slotFor(seed: string, n: number): number {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % n;
}

function withAnswer(seed: string, wrong: string[], right: string) {
  const at = slotFor(seed, wrong.length + 1);
  const all = [...wrong.slice(0, at), right, ...wrong.slice(at)];
  return { options: all.map((text, i) => ({ key: KEYS[i], text })), correct: KEYS[at] };
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
  const [recall, setRecall] = useState(false);
  const gap = chunkGap(text, d);
  const meaning = d.hindi?.dev ?? d.hindi?.roman ?? null;
  const pick = withAnswer(code, distractors.slice(0, 3), text);
  const wrongReplies = (d.reply_wrong ?? []).slice(0, 3);
  const reply = d.reply && wrongReplies.length ? withAnswer(`${code}-reply`, wrongReplies, d.reply) : null;

  // The reply answers the chunk as said aloud; a frame with blanks
  // ("I'm going to…") is shown through its example sentence instead.
  const said = /…|_{2,}|\(/.test(text) && d.example ? d.example : text;

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

      {meaning && distractors.length >= 2 ? (
        <Block n={++n} title="Multiple Choice" tone="text-tag-blue">
          <p className="text-base">{meaning}</p>
          {d.hindi?.dev && d.hindi.roman ? <p className="text-xs text-ink-muted">{d.hindi.roman}</p> : null}
          <Mcq options={pick.options} correct={pick.correct} />
        </Block>
      ) : null}

      {reply ? (
        <Block n={++n} title="What would you reply?" tone="text-tag-navy">
          <p>A: “{said}”</p>
          <Mcq options={reply.options} correct={reply.correct} />
        </Block>
      ) : null}

      {meaning ? (
        <Block n={++n} title="Quick Recall (Reverse)" tone="text-tag-navy">
          <p>Read the Hindi, then say the English {d.slot ? "frame" : "chunk"} aloud: {meaning}</p>
          <button
            type="button"
            onClick={() => setRecall(true)}
            aria-live="polite"
            className="mt-2 rounded-lg border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-hover"
          >
            {recall ? text : "Tap to see answer"}
          </button>
        </Block>
      ) : null}

      {d.hindi_example && d.example ? (
        <Block n={++n} title="Translate (Hindi → English)" tone="text-tag-saffron">
          <p className="text-base">{d.hindi_example.dev ?? d.hindi_example.roman}</p>
          {d.hindi_example.dev && d.hindi_example.roman ? <p className="text-xs text-ink-muted">{d.hindi_example.roman}</p> : null}
          <TypeCheck id="chunk-translate" answer={d.example} placeholder="Write it in English, using the chunk" />
        </Block>
      ) : null}

      <div className="[&>div]:border-saffron/50">
        <Block n={++n} title="Speaking Task (for audit)" tone="text-tag-saffron">
          <p>
            {d.speaking_task ?? (
              <>Make one sentence of your own with <b>“{text}”</b> — about your day, your work or your studies.</>
            )}
          </p>
          <OwnSentence id="chunk-own" />
        </Block>
      </div>

      <ReviewPlan stage={stage} dueLabel={dueLabel} />
      <ExitButtons videoUrl={videoUrl} recordHref={recordHref} />
    </div>
  );
}
