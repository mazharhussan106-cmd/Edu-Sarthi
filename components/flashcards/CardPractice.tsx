// Owns page 3 of a flashcard: the practice zone (MCQ, fill the blank, find &
// fix, translate, own sentence), real-life examples, the review plan, a
// reverse recall, and the two exits — watch the video, or record yourself for
// a teacher's audit.
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
import { lines, parseOptions, sameAnswer, splitArrow, type WordDetails } from "@/lib/wordCard";

function Block({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-xs font-semibold text-accent">
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
  const fill = splitArrow(d.fill_in_the_blank_to_answer);
  const fix = splitArrow(d.find_and_fix_to_correct);
  const tr = splitArrow(d.translate);

  const real = [
    { label: "Everyday", text: d.everyday_scene },
    { label: "News style", text: d.news_style_line },
    { label: "Casual talk", text: d.casual_conversation },
  ].filter((r) => r.text);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-base font-bold text-ink">Practice zone</h3>

      {d.mcq_question && options.length ? (
        <Block n={1} title="Multiple choice">
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
        <Block n={2} title="Fill in the blank">
          <p>{fill.prompt}</p>
          <TypeCheck id="fill" answer={fill.answer} placeholder="Type the missing word" />
        </Block>
      ) : null}

      {fix.answer ? (
        <Block n={3} title="Find & fix the mistake">
          <p className="text-error">{fix.prompt}</p>
          <TypeCheck id="fix" answer={fix.answer} placeholder="Write the correct sentence" />
        </Block>
      ) : null}

      {tr.answer ? (
        <Block n={4} title="Translate (Hindi → English)">
          <p className="text-base">{tr.prompt}</p>
          <TypeCheck id="translate" answer={tr.answer} placeholder="Write it in English" />
        </Block>
      ) : null}

      {d.write_your_own_sentence ? (
        <Block n={5} title="Use it in your own sentence">
          <p>{d.write_your_own_sentence}</p>
          <p className="mt-1 text-xs text-ink-muted">Say it out loud — then record it below for your teacher.</p>
        </Block>
      ) : null}

      {real.length || d.emotion_feel || d.visual_association ? (
        <>
          <h3 className="mt-2 font-display text-base font-bold text-ink">Examples in real life</h3>
          <div className="flex flex-col gap-2">
            {real.map((r) => (
              <div key={r.label} className="rounded-lg bg-paper-dim p-2.5 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{r.label}</p>
                {lines(r.text).map((l) => <p key={l} className="text-ink">{l}</p>)}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              {d.emotion_feel ? (
                <div className="rounded-lg border border-border p-2.5 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Feel</p>
                  <p className="text-ink">{d.emotion_feel}</p>
                </div>
              ) : null}
              {d.visual_association ? (
                <div className="rounded-lg border border-border p-2.5 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Picture it</p>
                  <p className="text-ink">{d.visual_association}</p>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <div className="rounded-xl border border-border bg-surface p-3">
        <p className="text-xs font-semibold text-accent">Your review plan</p>
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

      {d.reverse_quick_recall ? (
        <button
          type="button"
          onClick={() => setRecall(true)}
          className="rounded-xl border border-dashed border-border-strong p-3 text-left text-sm"
        >
          <p className="text-xs font-semibold text-accent">Quick recall</p>
          <p className="mt-1 text-ink">{d.reverse_quick_recall}</p>
          <p className="mt-1 font-medium text-ink">{recall ? d.recall_answer : "Tap to reveal"}</p>
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-2 pt-1">
        {videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border-strong p-4 text-sm text-ink hover:bg-hover"
          >
            <PlayCircle className="h-7 w-7 text-accent" aria-hidden="true" />
            See video
          </a>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border p-4 text-sm text-mist">
            <PlayCircle className="h-7 w-7" aria-hidden="true" />
            Video coming soon
          </div>
        )}
        {recordHref ? (
          <Link
            href={recordHref}
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-accent p-4 text-center text-sm font-medium text-on-accent hover:bg-accent-dark"
          >
            <Mic className="h-7 w-7" aria-hidden="true" />
            Record yourself for audit
          </Link>
        ) : null}
      </div>
    </div>
  );
}
