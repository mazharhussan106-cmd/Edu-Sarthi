// Owns the building blocks of a card's practice side, shared by word and
// chunk cards: a numbered block, a typed answer with Check / Show answer, a
// multiple-choice question, a free "own sentence" box, the spaced-repetition
// plan, and the two large exits (See video, Record yourself for audit).
//
// Answers are checked in the browser against the sheet's own answers. That is
// fine for self-practice: nothing here is scored or saved, so there is nothing
// to cheat. It deliberately holds no card data of its own.

"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Mic, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { LADDER_DAYS } from "@/lib/srs";
import { cn } from "@/lib/utils";
import { sameAnswer } from "@/lib/wordCard";

export function Block({ n, title, tone, children }: { n: number; title: string; tone: string; children: ReactNode }) {
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
export function TypeCheck({ id, answer, placeholder }: { id: string; answer: string; placeholder: string }) {
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
        className="h-9 rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
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

/// Options keyed "A", "B", …; `correct` is the right key.
export function Mcq({ options, correct }: { options: { key: string; text: string }[]; correct: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <>
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
        <p aria-live="polite" className={cn("mt-2 text-xs font-medium", picked === correct ? "text-success" : "text-error")}>
          {picked === correct ? "Correct!" : `The answer is ${correct}.`}
        </p>
      ) : null}
    </>
  );
}

export function OwnSentence({ id }: { id: string }) {
  const [own, setOwn] = useState("");
  return (
    <>
      <label htmlFor={id} className="sr-only">Your sentence</label>
      <textarea
        id={id}
        rows={2}
        value={own}
        onChange={(e) => setOwn(e.target.value)}
        placeholder="Write your sentence here"
        className="mt-2 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
      />
      <p className="mt-1 text-xs text-ink-muted">Not saved or marked. Say it out loud, then record it below for your teacher.</p>
    </>
  );
}

/// In ink only, at the owner's request: the plan is information, not a
/// heading to scan for, so it stays out of the colour coding. Done steps are
/// filled, the next one is outlined bold, later ones faint.
export function ReviewPlan({ stage, dueLabel }: { stage: number | null; dueLabel: string | null }) {
  return (
    <div className="rounded-xl border border-border-strong bg-surface p-3 text-ink">
      <p className="font-display text-[0.8em] font-bold">Spaced Repetition · Your Review Plan</p>
      <ol className="mt-2 flex flex-wrap items-center gap-1.5 text-xs" aria-label="Review steps">
        {LADDER_DAYS.map((day, i) => {
          const done = stage !== null && i < stage;
          const next = stage === i;
          return (
            <li
              key={day}
              aria-current={next ? "step" : undefined}
              className={cn(
                "rounded-md border px-2 py-1 font-mono",
                done && "border-ink bg-ink text-surface",
                next && "border-2 border-ink font-bold",
                !done && !next && "border-border-strong",
              )}
            >
              {done ? "✓ " : ""}Day {day}
              {next ? " · next" : ""}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs">{dueLabel ? `Next review ${dueLabel}.` : "Mark Known or Unknown to start the plan."}</p>
    </div>
  );
}

/// Deliberately large (the owner asked for three times the old height): these
/// are the point of the card, not a footnote.
export function ExitButtons({ videoUrl, recordHref }: { videoUrl: string | null; recordHref: string | null }) {
  return (
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
  );
}
