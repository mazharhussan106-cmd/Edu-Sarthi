// Owns the public landing page. Fully server-rendered — the FAQ uses native
// <details>, so the whole page ships zero JavaScript.
//
// It deliberately has no testimonials, no rating summary and no stats strip.
// Those need real students and real reviews; inventing them is the one thing
// this page must not do.
//
// It deliberately does NOT use StickyHeader either. That header carries a
// settings menu with sign-out, which is wrong for a visitor who is not signed
// in.

import Link from "next/link";
import { ClipboardCheck, Mic, MessageSquareText } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Footer } from "@/components/layout/Footer";

const FEATURES = [
  {
    icon: Mic,
    title: "Submit how you practise",
    body: "Record straight in the browser, upload an audio or video file, or photograph written work. Whatever you already do, send that.",
  },
  {
    icon: ClipboardCheck,
    title: "Five things, scored separately",
    body: "Pronunciation, grammar, fluency, vocabulary and confidence — each scored on its own, so you can see which one is actually holding you back.",
  },
  {
    icon: MessageSquareText,
    title: "Notes fixed to the moment",
    body: "Each note is pinned to a timestamp. Press it and hear exactly what the teacher heard, instead of guessing which sentence they meant.",
  },
] as const;

const FAQ = [
  {
    q: "Is the feedback from a real teacher or from software?",
    a: "A person. Every audit is written by a teacher who listens to your submission. Nothing on this site is scored automatically.",
  },
  {
    q: "How long does an audit take to come back?",
    a: "It depends on how many submissions are in the queue. You will see the status of yours — pending, in review, or reviewed — so you are never left wondering.",
  },
  {
    q: "Who can hear my recordings?",
    a: "You and the teacher reviewing your submission. Recordings are private by default and are not published, shared or used as examples.",
  },
  {
    q: "Do I need a good microphone or a quiet room?",
    a: "A phone in a normal room is fine. If audio is unclear enough to affect the audit, the teacher will say so rather than guess.",
  },
  {
    q: "Can I become a teacher on Edusarthi?",
    a: "Not through the signup form. Teacher accounts are set up manually, because a teacher account can read student submissions.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-nav-bg">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <Link
            href="/"
            className="font-display text-lg font-bold text-ink hover:text-accent"
          >
            Edusarthi
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
              Someone actually listens to your English.
            </h1>
            <p className="mt-4 text-base text-ink-muted">
              Send a recording. A teacher listens to all of it and sends back a
              written audit — five scores, a summary, and notes pinned to the
              exact moments that need work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button>Create an account</Button>
              </Link>
              <Link href="/about">
                <Button variant="outline">How it works</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-paper-dim">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-display text-lg font-bold text-ink">
              What you get back
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title}>
                  <feature.icon
                    className="h-5 w-5 text-accent"
                    aria-hidden="true"
                  />
                  <CardTitle className="mt-3">{feature.title}</CardTitle>
                  <p className="mt-2 text-sm text-ink-muted">{feature.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <Card className="border-border-strong">
            <CardTitle>Honest about what this isn&apos;t</CardTitle>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-muted">
              <li>
                This is not instant. A person listens to your recording, so
                feedback takes as long as that takes.
              </li>
              <li>
                This is not an accent-removal service. The goal is being
                understood clearly, not sounding like someone else.
              </li>
              <li>
                This is not a certificate mill. Scores describe your submission.
                They are not a qualification and no exam board recognises them.
              </li>
              <li>
                This will not fix anything on its own. The audit tells you what
                to practise. The practice is still yours to do.
              </li>
            </ul>
          </Card>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="font-display text-lg font-bold text-ink">
              Questions
            </h2>
            <div className="mt-6 divide-y divide-border border-y border-border">
              {FAQ.map((item) => (
                // Native <details>: open/close, keyboard support and screen
                // reader announcement all come free, and the page stays a
                // server component with no JavaScript at all.
                <details key={item.q} className="group py-4">
                  <summary className="cursor-pointer list-none font-body text-sm font-medium text-ink marker:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {item.q}
                      <span
                        aria-hidden="true"
                        className="text-ink-muted transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-ink-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-paper-dim">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h2 className="font-display text-2xl font-bold text-ink">
              Send your first recording
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted">
              Two minutes of speaking is enough to get a full audit back.
            </p>
            <Link href="/register" className="mt-6 inline-block">
              <Button>Create an account</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
