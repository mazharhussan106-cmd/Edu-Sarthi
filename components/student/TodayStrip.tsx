// Owns the top of the student home screen: the one "do this next" card, the
// streak, and today's goal.
//
// It deliberately takes the next action as data rather than deciding it. The
// dashboard already has every query that decision needs.

import Link from "next/link";

import { Card } from "@/components/ui/Card";

export type NextAction = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export function TodayStrip({
  next,
  streak,
  today,
  goal,
}: {
  next: NextAction;
  streak: number;
  today: number;
  goal: number;
}) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <Link
        href={next.href}
        className="flex flex-col gap-1 rounded-xl bg-accent/12 p-4 transition-colors hover:bg-accent/20"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          {next.eyebrow}
        </span>
        <span className="font-display text-lg font-bold text-ink">{next.title}</span>
        <span className="text-sm text-ink-muted">{next.body}</span>
        <span className="mt-2 inline-flex h-9 w-fit items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent">
          {next.cta}
        </span>
      </Link>
      <div className="grid grid-cols-2 gap-3 sm:contents">
        <Card className="flex flex-col justify-center p-4 sm:w-36">
          <p className="font-mono text-3xl font-bold text-ink">{streak}</p>
          <p className="text-xs text-ink-muted">
            day{streak === 1 ? "" : "s"} in a row
          </p>
        </Card>
        <Card className="flex flex-col justify-center p-4 sm:w-36">
          <p className="font-mono text-3xl font-bold text-ink">
            {today}/{goal}
          </p>
          <p className="text-xs text-ink-muted">
            {today >= goal ? "Today’s goal done" : "Recording today"}
          </p>
        </Card>
      </div>
    </div>
  );
}
