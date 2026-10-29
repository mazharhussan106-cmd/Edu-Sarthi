// Owns "Stage and badges" on the student dashboard: the stage the student's
// XP has reached and how far the next one is, the badge closest to done, and
// up to three badges already earned. The full list lives on Profile.
//
// Stages and badges are small on the page on purpose: research on gamified
// learning finds points and badges help as a sign of progress but wear off as
// a goal in themselves (docs/DASHBOARD-PLAN.md), so the task list stays first.

import Link from "next/link";
import { Award } from "lucide-react";

import { Card, CardTitle } from "@/components/ui/Card";
import { toGo, type Badge } from "@/lib/badges";

export function StageCard({
  xp,
  stage,
  badges,
  next,
}: {
  xp: number;
  stage: { stage: number; from: number; to: number };
  badges: readonly Badge[];
  next: Badge | null;
}) {
  const pct = ((xp - stage.from) / (stage.to - stage.from)) * 100;
  // Thresholds rise down the list, so the last ones earned are the biggest.
  const earned = badges.filter((b) => b.earned).slice(-3).reverse();

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>Stage and badges</CardTitle>
        <Link href="/profile" className="text-sm font-semibold text-accent-dark hover:underline">All badges</Link>
      </div>
      <p className="mt-2 flex items-baseline justify-between gap-3">
        <b className="font-display text-xl font-bold text-ink">Stage {stage.stage}</b>
        <span className="font-mono text-xs text-ink-muted">{xp.toLocaleString("en-IN")} / {stage.to.toLocaleString("en-IN")} XP</span>
      </p>
      <span
        className="mt-2 block h-2 overflow-hidden rounded-full bg-paper-dim"
        role="img"
        aria-label={`${(stage.to - xp).toLocaleString("en-IN")} XP to Stage ${stage.stage + 1}`}
      >
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      <p className="mt-1.5 text-xs text-ink-muted">{(stage.to - xp).toLocaleString("en-IN")} XP to Stage {stage.stage + 1}.</p>

      {next ? (
        <p className="mt-3 flex items-center gap-2.5 rounded-lg bg-paper-dim px-3 py-2.5 text-sm text-ink">
          <Award aria-hidden="true" className="h-4 w-4 shrink-0 text-tag-saffron" />
          <span>Next badge: <b>{next.label}</b> · {toGo(next)}</span>
        </p>
      ) : null}

      {earned.length > 0 ? (
        <ul className="mt-3 grid grid-cols-3 gap-2" aria-label="Badges earned">
          {earned.map((b) => (
            <li key={b.id} className="flex flex-col items-center gap-1.5 text-center text-xs text-ink-muted">
              <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-saffron/16 text-tag-saffron">
                <Award className="h-5 w-5" />
              </span>
              {b.label}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
