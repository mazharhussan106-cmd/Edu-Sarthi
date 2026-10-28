// Owns the practice half of side 3 on a customer-support card, in the order
// of the approved mockup: fill the blank, pick the best line (with why),
// put the words in order, say it in English from the Hindi, what the
// customer says next and a model reply, the role-play, the task for the
// teacher's audit with its self-check, the review plan, and the two exits.
//
// Every question comes from the card's own fields (the workbook wrote one of
// each for every card), and a question whose material is missing or does not
// parse is left out rather than shown broken.
//
// Email cards cannot be said, so their audit task is written: a box to draft
// the reply in, and the exit sends a photo of it instead of a recording.

"use client";

import { Block, ExitButtons, Mcq, OwnSentence, ReviewPlan, TypeCheck } from "@/components/flashcards/PracticeParts";
import { Reorder, Reveal, SelfCheck } from "@/components/flashcards/support/SupportTasks";
import { dotList, mcqOptions, type SupportDetails } from "@/lib/supportCard";

export function SupportPractice({
  code,
  d,
  email,
  stage,
  dueLabel,
  videoUrl,
  recordHref,
}: {
  code: string;
  d: SupportDetails;
  email: boolean;
  stage: number | null;
  dueLabel: string | null;
  videoUrl: string | null;
  recordHref: string | null;
}) {
  const options = mcqOptions(d.mcq_options);
  const jumble = (d.reorder_task ?? "").split(" / ").map((w) => w.trim()).filter(Boolean);
  const checks = dotList(d.self_check);

  return (
    <div className="practice-steps flex flex-col gap-3">
      <h3 className="font-display text-[0.75em] font-extrabold tracking-widest text-tag-navy">PRACTICE ZONE</h3>

      {d.fill_blank && d.fill_answer ? (
        <Block title="Fill in the blank" tone="text-tag-green">
          <p>“{d.fill_blank}”</p>
          <TypeCheck id={`${code}-gap`} answer={d.fill_answer} placeholder="Type the missing word or words" />
        </Block>
      ) : null}

      {d.mcq_question && options.length && d.mcq_answer ? (
        <Block title="Which line is best?" tone="text-tag-blue">
          <p>{d.mcq_question}</p>
          <Mcq options={options} correct={d.mcq_answer} />
          {d.mcq_why ? (
            <details className="mt-2 text-xs text-ink-muted">
              <summary className="cursor-pointer text-accent">Why that answer?</summary>
              <p className="mt-1">{d.mcq_why}</p>
            </details>
          ) : null}
        </Block>
      ) : null}

      {jumble.length >= 3 && d.reorder_answer ? (
        <Block title="Put the words in order" tone="text-tag-teal">
          <Reorder words={jumble} answer={d.reorder_answer} />
        </Block>
      ) : null}

      {d.hindi_to_english && d.hindi_to_english_answer ? (
        <Block title={email ? "Write it in English" : "Say it in English"} tone="text-tag-saffron" hindiTask>
          <p>{d.hindi_to_english}</p>
          <Reveal label="Tap to see a model answer" answer={d.hindi_to_english_answer} />
        </Block>
      ) : null}

      {d.whats_next_customer && d.whats_next_reply ? (
        <Block title={`Customer says: “${d.whats_next_customer}”`} tone="text-tag-green">
          <p>What do you {email ? "write" : "say"} back?</p>
          <Reveal label="Tap to see a model reply" answer={d.whats_next_reply} />
        </Block>
      ) : null}

      {d.role_play ? (
        <Block title="Role-play with a partner" tone="text-tag-navy">
          <p>{d.role_play}</p>
        </Block>
      ) : null}

      <div className="[&>div]:border-saffron/50">
        <Block title={email ? "Write it for audit" : "Record it for audit"} tone="text-tag-saffron">
          <p>{d.record_task ?? (email ? "Write the email in your own words." : "Record yourself saying the line.")}</p>
          {email ? (
            <OwnSentence
              id={`${code}-own`}
              hint="Not saved here. Write it on paper or in your notes, then send a photo or screenshot below for your teacher."
            />
          ) : null}
          {checks.length ? (
            <>
              <p className="mt-3 text-xs font-bold text-ink">Before you send it, check:</p>
              <SelfCheck items={checks} />
            </>
          ) : null}
        </Block>
      </div>

      <ReviewPlan stage={stage} dueLabel={dueLabel} />
      <ExitButtons videoUrl={videoUrl} recordHref={recordHref} photo={email} />
    </div>
  );
}
