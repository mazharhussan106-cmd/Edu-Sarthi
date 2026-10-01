// Owns the practice half of a word card's side 3: the practice zone (MCQ,
// fill the blank, find & fix, translate, own sentence, reverse recall), the
// review plan, and the two exits — watch the video, or record yourself for a
// teacher's audit.
//
// Real-life examples come before this on the same side, from CardRealLife.
// The building blocks are shared with chunk cards (PracticeParts); this file
// only decides which of the word sheet's columns feed which block.

"use client";

import { useState } from "react";

import { Block, ExitButtons, Mcq, OwnSentence, ReviewPlan, TypeCheck } from "@/components/flashcards/PracticeParts";
import { parseOptions, splitArrow, type WordDetails } from "@/lib/wordCard";

export function CardPractice({
  d,
  stage,
  dueLabel,
  videoUrl,
  recordHref,
}: {
  d: WordDetails;
  stage: number | null;
  dueLabel: string | null;
  videoUrl: string | null;
  recordHref: string | null;
}) {
  const options = parseOptions(d.mcq_options);
  const correct = (d.mcq_answer ?? "").trim().charAt(0);
  const [recall, setRecall] = useState(false);
  const fill = splitArrow(d.fill_in_the_blank_to_answer);
  const fix = splitArrow(d.find_and_fix_to_correct);
  const tr = splitArrow(d.translate);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-[0.75em] font-extrabold tracking-widest text-tag-navy">PRACTICE ZONE</h3>

      {d.mcq_question && options.length ? (
        <Block n={1} title="Multiple Choice" tone="text-tag-blue">
          <p>{d.mcq_question}</p>
          <Mcq options={options} correct={correct} />
        </Block>
      ) : null}

      {fill.answer ? (
        <Block n={2} title="Fill in the Blank" tone="text-tag-green">
          <p>{fill.prompt}</p>
          <TypeCheck id="fill" answer={fill.answer} placeholder="Type the missing word" />
        </Block>
      ) : null}

      {fix.answer ? (
        <Block n={3} title="Find & Fix" tone="text-tag-red">
          <p className="text-error">{fix.prompt}</p>
          <TypeCheck id="fix" answer={fix.answer} placeholder="Write the correct sentence" />
        </Block>
      ) : null}

      {tr.answer ? (
        <Block n={4} title="Translate (Hindi → English)" tone="text-tag-saffron">
          <p className="text-base">{tr.prompt}</p>
          <TypeCheck id="translate" answer={tr.answer} placeholder="Write it in English" />
        </Block>
      ) : null}

      {d.write_your_own_sentence ? (
        <Block n={5} title="Use in Your Own Sentence" tone="text-tag-teal">
          <p>{d.write_your_own_sentence}</p>
          <OwnSentence id="own-sentence" />
        </Block>
      ) : null}

      {d.reverse_quick_recall ? (
        <Block n={6} title="Quick Recall (Reverse)" tone="text-tag-navy">
          <p>{d.reverse_quick_recall}</p>
          <button
            type="button"
            onClick={() => setRecall(true)}
            aria-live="polite"
            className="mt-2 rounded-lg border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-hover"
          >
            {recall ? d.recall_answer : "Tap to see answer"}
          </button>
        </Block>
      ) : null}

      <ReviewPlan stage={stage} dueLabel={dueLabel} />
      <ExitButtons videoUrl={videoUrl} recordHref={recordHref} />
    </div>
  );
}
