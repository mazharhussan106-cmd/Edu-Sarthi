// Owns the about page: what Edusarthi does, how the loop works, and what it
// deliberately is not.
//
// Every claim here has to be one the product actually delivers. No student
// numbers, no success rates, no testimonials — there are none yet, and
// inventing them is the one thing this page must not do.

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";

export const metadata = {
  title: "About — Edusarthi",
  description:
    "How Edusarthi works: you send a recording, a teacher sends back a scored audit with timestamped notes.",
};

const STEPS = [
  {
    n: "1",
    title: "Pick an exercise",
    body: "Each module has exercises with a specific prompt — introduce yourself, explain something you know, read a passage aloud. You can start at any level.",
  },
  {
    n: "2",
    title: "Record or upload",
    body: "Record straight in the browser, upload an audio or video file, or photograph written work. A phone in a normal room is good enough.",
  },
  {
    n: "3",
    title: "A teacher listens to all of it",
    body: "Your submission joins a queue, oldest first. A teacher claims it, plays it through, and writes the audit while listening.",
  },
  {
    n: "4",
    title: "You get five scores and the moments they came from",
    body: "Pronunciation, grammar, fluency, vocabulary and confidence, each scored out of ten. Plus a summary, and notes pinned to timestamps you can press to hear again.",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">
        What Edusarthi is
      </h1>
      <p className="mt-4 text-base text-ink-muted">
        Most spoken-English practice gives you a score and no explanation, or an
        explanation so general it fits anyone. Edusarthi does the opposite: a
        teacher listens to your actual recording and tells you which sentence
        went wrong and why.
      </p>

      <h2 className="mt-12 font-display text-lg font-bold text-ink">
        How it works
      </h2>
      <div className="mt-6 flex flex-col gap-4">
        {STEPS.map((step) => (
          <Card key={step.n} className="flex gap-4">
            <span className="font-mono text-sm font-bold text-accent">
              {step.n}
            </span>
            <div className="min-w-0">
              <CardTitle>{step.title}</CardTitle>
              <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mt-12 font-display text-lg font-bold text-ink">
        What the five scores mean
      </h2>
      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <div>
          <dt className="font-medium text-ink">Pronunciation</dt>
          <dd className="text-ink-muted">
            Whether individual sounds and word stress land clearly enough for a
            listener to follow without effort. Not whether you have an accent.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Grammar</dt>
          <dd className="text-ink-muted">
            Tense, agreement, articles and sentence structure as spoken — judged
            the way speech is judged, not the way an essay is.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Fluency</dt>
          <dd className="text-ink-muted">
            Whether you keep going. Pauses to think are normal; the score
            reflects hesitation that breaks the thread.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Vocabulary</dt>
          <dd className="text-ink-muted">
            Whether the words you reach for fit what you mean, and whether you
            can say a thing more than one way.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Confidence</dt>
          <dd className="text-ink-muted">
            Pace, volume and whether you commit to a sentence or trail off. It is
            the most audible thing and the least talked about.
          </dd>
        </div>
      </dl>

      <h2 className="mt-12 font-display text-lg font-bold text-ink">
        What it isn&apos;t
      </h2>
      <Card className="mt-4 border-border-strong">
        <ul className="flex flex-col gap-2 text-sm text-ink-muted">
          <li>
            Not instant. A person listens to your recording, so feedback takes as
            long as that takes.
          </li>
          <li>
            Not accent removal. The goal is being understood clearly, not
            sounding like someone else.
          </li>
          <li>
            Not a qualification. Scores describe one submission. No exam board
            recognises them and no employer should be shown them as a
            certificate.
          </li>
          <li>
            Not automatic. Nothing on this site is scored by software. If that
            ever changes, this page will say so.
          </li>
        </ul>
      </Card>

      <div className="mt-10">
        <Link href="/register">
          <Button>Create an account</Button>
        </Link>
      </div>
    </main>
  );
}
