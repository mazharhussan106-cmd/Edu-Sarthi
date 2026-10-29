// Owns what the XP sheet shows when the ⭐ pill on the dashboard is tapped:
// XP today, this week and on the best day, the stage bar, and every rule for
// earning XP, so nothing about points is hidden.
//
// A server component, handed to StatPills already rendered (see
// StreakSheet). The rules are read from lib/streak, the same constants the
// counting uses, so the table cannot drift from what is counted.

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { DAILY_GOALS, XP_NEW_CARD, XP_RECORDING, XP_REVIEW, XP_SINCE } from "@/lib/streak";

const RULES = [
  ["Learn a new card", XP_NEW_CARD],
  ["Review a card (once per card a day)", XP_REVIEW],
  ["Send a recording for audit", XP_RECORDING],
  ["Re-record one your teacher sent back", XP_RECORDING],
] as const;

export function XpSheet({
  total,
  today,
  week,
  best,
  goal,
  stage,
}: {
  total: number;
  today: number;
  week: number;
  best: number;
  goal: number;
  stage: { stage: number; from: number; to: number };
}) {
  const goalName = DAILY_GOALS.find((g) => g.xp === goal)?.name ?? "Custom";
  return (
    <div>
      <span
        className="block h-2 overflow-hidden rounded-full bg-paper-dim"
        role="img"
        aria-label={`${(stage.to - total).toLocaleString("en-IN")} XP to Stage ${stage.stage + 1}`}
      >
        <span className="block h-full rounded-full bg-accent" style={{ width: `${((total - stage.from) / (stage.to - stage.from)) * 100}%` }} />
      </span>
      <p className="mt-1.5 text-xs text-ink-muted">{(stage.to - total).toLocaleString("en-IN")} XP to Stage {stage.stage + 1}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["today", today],
          ["this week", week],
          ["best day", best],
        ].map(([label, n]) => (
          <div key={label} className="rounded-lg bg-paper-dim p-2.5">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="font-mono text-lg font-bold text-ink">{(n as number).toLocaleString("en-IN")}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm font-semibold text-ink">How you earn XP</p>
      <ul className="mt-1 divide-y divide-border">
        {RULES.map(([what, xp]) => (
          <li key={what} className="flex min-h-10 items-center justify-between gap-3 text-sm text-ink">
            <span>{what}</span>
            <b className="font-mono text-accent-dark">+{xp}</b>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">
        XP is for practice, not for marks: audit scores never change it. Deck cards count too. Card XP counts from {XP_SINCE}, when study history began.
      </p>

      <Link href="/settings#daily-goal" className="mt-4 flex min-h-11 items-center gap-2 rounded-lg bg-paper-dim px-3 text-sm text-ink hover:bg-hover">
        <span className="flex-1">Daily goal: <b>{goalName} · {goal} XP</b></span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-muted" />
      </Link>
    </div>
  );
}
