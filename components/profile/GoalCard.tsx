// Owns the My goal card on the student Profile: what they are practising for,
// their own pick of level, the target date, and today's XP and this week's
// days against the student's own daily and weekly goals.
//
// The goals are the dashboard's (lib/streak, chosen in Settings → Flashcards),
// so the card and the dashboard's ring always show the same numbers. It
// deliberately invents no target of its own.

import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/Card";
import { GoalEditor } from "@/components/profile/GoalEditor";
import { daysUntil, goalDateLabel } from "@/lib/goalDate";
import { GOALS, LEVELS } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const labelOf = (list: readonly { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? "Not set";

function PlanBar({ label, done, of }: { label: string; done: number; of: number }) {
  const pct = of > 0 ? Math.min(100, Math.round((done / of) * 100)) : 0;
  const complete = done >= of;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-36 shrink-0 text-ink">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper-dim" aria-hidden="true">
        <span className={cn("block h-full rounded-full", complete ? "bg-success" : "bg-accent")} style={{ width: `${pct}%` }} />
      </span>
      <span className={cn("w-10 shrink-0 text-right font-mono", complete ? "text-success" : "text-ink-muted")}>{complete ? "Done" : `${pct}%`}</span>
    </div>
  );
}

function countdown(days: number): string {
  if (days > 1) return `${days} days left`;
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Today. All the best!";
  return "This day has passed. Set your next one.";
}

export function GoalCard({
  goal,
  level,
  goalDate,
  todayXp,
  dailyGoalXp,
  weekMet,
  weeklyGoalDays,
}: {
  goal: string;
  level: string;
  goalDate: string;
  todayXp: number;
  dailyGoalXp: number;
  weekMet: number;
  weeklyGoalDays: number;
}) {
  const left = goalDate ? daysUntil(goalDate) : null;
  return (
    <Card id="my-goal" className="scroll-mt-20 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>My goal</CardTitle>
        <GoalEditor goal={goal} level={level} goalDate={goalDate} />
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-ink-muted">Practising for</dt>
        <dd className="font-medium text-ink">{labelOf(GOALS, goal)}</dd>
        <dt className="text-ink-muted">My level</dt>
        <dd className="font-medium text-ink">
          {labelOf(LEVELS, level)}
          {level !== "unset" ? <span className="font-normal text-ink-muted"> (my own pick)</span> : null}
        </dd>
        <dt className="text-ink-muted">Target date</dt>
        <dd className="font-medium text-ink">
          {left === null ? (
            "Not set"
          ) : (
            <>
              {goalDateLabel(goalDate)}
              <span className={cn("block text-xs font-normal", left < 0 ? "text-ink-muted" : "text-accent-dark")}>{countdown(left)}</span>
            </>
          )}
        </dd>
      </dl>
      <div className="mt-4 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-ink">Your daily and weekly goal</h3>
        <PlanBar label={`${Math.min(todayXp, dailyGoalXp)} of ${dailyGoalXp} XP today`} done={todayXp} of={dailyGoalXp} />
        <PlanBar label={`${Math.min(weekMet, weeklyGoalDays)} of ${weeklyGoalDays} days this week`} done={weekMet} of={weeklyGoalDays} />
        <Link href="/settings#daily-goal" className="self-start text-xs font-medium text-accent-dark hover:underline">
          Change these goals in Settings ›
        </Link>
      </div>
    </Card>
  );
}
