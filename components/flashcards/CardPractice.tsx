// Owns the practice half of side 3: the practice zone (MCQ, fill the blank,
// find & fix, translate, own sentence, reverse recall), the review plan, and
// the two exits — watch the video, or record yourself for a teacher's audit.
// Those two are deliberately large (the owner asked for them three times the
// old height): they are the point of the card, not a footnote.
//
// Real-life examples come before this on the same side, from CardRealLife.
//
// Answers are checked in the browser against the sheet's own answers. That is
// fine for self-practice: nothing here is scored or saved, so there is nothing
// to cheat.

"use client";

import Link from "next/link";
import { useState } from "react";
import { Mic, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { LADDER_DAYS } from "@/lib/srs";
import { cn } from "@/lib/utils";
import { parseOptions, sameAnswer, splitArrow, type WordDetails } from "@/lib/wordCard";

function Block({ n, title, tone, children }: { n: number; title: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className={cn("font-display text-[0.8em] font-bold", tone)}>
        {n}. {title}
      </p>
      <div className="mt-2 text-sm text-ink">{children}</div>
    </div>
  );
}

/// A typed answer with a Check button and a Show answer fallback.
function TypeCheck({ id, answer, placeholder }: { id: string; answer: string; placeholder: string }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"right" | "wrong" | "shown" | null>(null);
  return (
    <div className="mt-2 flex flex-col gap-2">
      <input
        id={id}
        aria-label={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setResult(null);
        }}
        placeholder={placeholder}
        className="h-9 rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-mist focus:border-accent focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setResult(sameAnswer(value, answer) ? "right" : "wrong")} disabled={!value.trim()}>
          Check
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setResult("shown")}>
          Show answer
        </Button>
        {result === "right" ? <span className="text-xs font-medium text-success">Correct!</span> : null}
        {result === "wrong" ? <span className="text-xs font-medium text-error">Not quite — try again or show the answer.</span> : null}
      </div>
      {result === "shown" || result === "right" ? <p className="text-xs text-ink-muted">Answer: {answer}</p> : null}
    </div>
  );
}

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
  const [picked, setPicked] = useState<string | null>(null);
  const [recall, setRecall] = useState(false);
  const [own, setOwn] = useState("");
  const fill = splitArrow(d.fill_in_the_blank_to_answer);
  const fix = splitArrow(d.find_and_fix_to_correct);
  const tr = splitArrow(d.translate);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-[0.75em] font-extrabold tracking-widest text-tag-navy">PRACTICE ZONE</h3>

      {d.mcq_question && options.length ? (
        <Block n={1} title="Multiple Choice" tone="text-tag-blue">
          <p>{d.mcq_question}</p>
          <div className="mt-2 flex flex-col gap-1.5" role="radiogroup" aria-label="Options">
            {options.map((o) => {
              const state = picked === null ? null : o.key === correct ? "right" : o.key === picked ? "wrong" : null;
              return (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={picked === o.key}
                  onClick={() => setPicked(o.key)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm",
                    state === "right" && "border-success bg-success/10",
                    state === "wrong" && "border-error bg-error/10",
                    state === null && "border-border-strong hover:bg-hover",
                  )}
                >
                  <span className="font-mono text-xs text-ink-muted">{o.key})</span> {o.text}
                </button>
              );
            })}
          </div>
          {picked ? (
            <p className={cn("mt-2 text-xs font-medium", picked === correct ? "text-success" : "text-error")}>
              {picked === correct ? "Correct!" : `The answer is ${correct}.`}
            </p>
          ) : null}
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
          <label htmlFor="own-sentence" className="sr-only">Your sentence</label>
          <textarea
            id="own-sentence"
            rows={2}
            value={own}
            onChange={(e) => setOwn(e.target.value)}
            placeholder="Write your sentence here"
            className="mt-2 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-mist focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-xs text-ink-muted">Not saved or marked. Say it out loud, then record it below for your teacher.</p>
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

      <div className="rounded-xl border border-border bg-surface p-3">
        <p className="font-display text-[0.8em] font-bold text-tag-green">Spaced Repetition · Your Review Plan</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {LADDER_DAYS.map((day, i) => (
            <span
              key={day}
              className={cn(
                "rounded-md px-2 py-1 font-mono",
                stage !== null && i < stage ? "bg-success/15 text-success" : stage === i ? "bg-accent text-on-accent" : "bg-paper-dim text-ink-muted",
              )}
            >
              Day {day}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-muted">{dueLabel ? `Next review ${dueLabel}.` : "Mark Known or Unknown to start the plan."}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pb-1 pt-1">
        {videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-accent p-4 font-display text-base font-bold text-accent hover:bg-hover"
          >
            <PlayCircle className="h-11 w-11" aria-hidden="true" />
            See video
          </a>
        ) : (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong p-4 text-center font-display text-base font-bold text-ink-muted">
            <PlayCircle className="h-11 w-11" aria-hidden="true" />
            Video coming soon
          </div>
        )}
        {recordHref ? (
          <Link
            href={recordHref}
            className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl bg-saffron p-4 text-center font-display text-base font-bold text-on-saffron hover:opacity-90"
          >
            <Mic className="h-11 w-11" aria-hidden="true" />
            Record yourself for audit
          </Link>
        ) : null}
      </div>
    </div>
  );
}
