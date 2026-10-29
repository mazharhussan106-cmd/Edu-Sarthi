// Owns the "Get started" card a new student sees on the Profile: a few first
// steps, each ticked off from what they have really done, with a link to do
// the next one. It disappears once every step is done.
//
// Guests get their own steps: they cannot send recordings, and the one thing
// that protects their progress is adding an email. It deliberately reads no
// data; the Profile passes the counts it already has.

import Link from "next/link";
import { Check } from "lucide-react";

import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Step = { label: string; done: boolean; href: string; cta: string };

export function stepsFor(s: { guest: boolean; goalSet: boolean; submissions: number; audits: number; cardsKnown: number }): Step[] {
  if (s.guest) {
    return [
      { label: "Learn your first 10 cards", done: s.cardsKnown >= 10, href: "/flashcards", cta: "Start" },
      { label: "Keep your progress with an email", done: false, href: "/settings", cta: "Add" },
    ];
  }
  return [
    { label: "Set your goal", done: s.goalSet, href: "#my-goal", cta: "Set" },
    { label: "Send your first recording", done: s.submissions > 0, href: "/class", cta: "Record" },
    { label: "Get your first audit back", done: s.audits > 0, href: "/feedback", cta: "See" },
    { label: "Learn your first 10 cards", done: s.cardsKnown >= 10, href: "/flashcards", cta: "Start" },
  ];
}

export function GetStarted({ steps }: { steps: Step[] }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <Card className="p-4 sm:p-5 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Get started</CardTitle>
        <span className="text-xs text-ink-muted">
          {done} of {steps.length} done
        </span>
      </div>
      <ol className="mt-2 divide-y divide-dashed divide-border">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 py-2.5 text-sm">
            <span
              aria-hidden="true"
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                s.done ? "border-success bg-success text-surface" : "border-border-strong",
              )}
            >
              {s.done ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
            <span className={cn("flex-1", s.done ? "text-ink-muted line-through" : "text-ink")}>
              {s.label}
              <span className="sr-only">{s.done ? ", done" : ", not done yet"}</span>
            </span>
            {s.done ? null : s.href.startsWith("#") ? (
              // A plain link: only it fires the hashchange that opens the goal
              // sheet; a Next <Link> to a hash on this page would only scroll.
              <a href={s.href} className="shrink-0 font-medium text-accent-dark hover:underline">
                {s.cta} ›
              </a>
            ) : (
              <Link href={s.href} className="shrink-0 font-medium text-accent-dark hover:underline">
                {s.cta} ›
              </Link>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
