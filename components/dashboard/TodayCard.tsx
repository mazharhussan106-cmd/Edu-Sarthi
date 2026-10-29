// Owns the Today card at the top of the student dashboard: the daily goal
// ring, the streak and what it needs today, and the week as seven dots.
//
// It takes numbers, not queries (lib/dashboard reads them). It deliberately
// changes colour for two moments only: saffron in the evening when a streak
// is about to break, green when today's goal is done. Every other day it
// stays calm, because a dashboard that is always alarmed is soon ignored.

import Link from "next/link";
import { Check, Flame } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { STREAK_MIN_XP, type WeekDot } from "@/lib/streak";
import { GoalTick } from "@/components/dashboard/GoalTick";

export type TodayNumbers = {
  /// The India day, so the goal moment can be shown once per day.
  day: string;
  xp: number;
  goal: number;
  streak: number;
  atRisk: boolean;
  week: readonly WeekDot[];
  weekMet: number;
  weeklyGoal: number;
};

const C = 2 * Math.PI * 42;

const DOT: Record<WeekDot["state"], string> = {
  met: "bg-success text-on-accent",
  learned: "bg-success/15 text-success",
  missed: "border-2 border-dashed border-border-strong",
  open: "border-2 border-accent text-accent-dark",
  future: "bg-paper-dim",
};

const SAY: Record<WeekDot["state"], string> = {
  met: "daily goal met",
  learned: "learned, goal not met",
  missed: "missed",
  open: "not yet",
  future: "still to come",
};

export function TodayCard({ t }: { t: TodayNumbers }) {
  const done = t.xp >= t.goal;
  const safe = t.xp >= STREAK_MIN_XP;
  const days = `${t.streak}-day streak`;
  const short = STREAK_MIN_XP - t.xp;
  // About twenty seconds a review.
  const mins = Math.max(1, Math.round(short / 3));

  const [title, line] = done
    ? ["Today's goal done", t.streak > 0 ? `${days}. Anything more today is a bonus.` : "Anything more today is a bonus."]
    : t.atRisk
      ? [`Keep your ${days}`, `Earn ${short} more XP before midnight. ${short} review${short === 1 ? "" : "s"} take${short === 1 ? "s" : ""} about ${mins} minute${mins === 1 ? "" : "s"}.`]
      : t.streak === 0
        ? ["Start a streak today", `Earn ${STREAK_MIN_XP} XP: about ${STREAK_MIN_XP} reviews, 5 new cards or 1 recording.`]
        : [days, safe ? "Safe for today ✓" : `Earn ${short} more XP today to keep it.`];

  return (
    <Card
      aria-label="Today"
      className={cn("p-4 sm:p-5", t.atRisk && !done && "border-saffron/45 bg-saffron/12", done && "border-success/40 bg-success/10")}
    >
      <div className="grid grid-cols-[92px_1fr] items-center gap-4">
        <div className="relative h-[92px] w-[92px]" role="img" aria-label={`${t.xp} of ${t.goal} XP today`}>
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className={done ? "stroke-success" : "stroke-paper-dim"} />
            {!done && t.xp > 0 ? (
              <circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(Math.min(t.xp, t.goal) / t.goal) * C} ${C}`}
                transform="rotate(-90 50 50)"
                className={t.atRisk ? "stroke-saffron" : "stroke-accent"}
              />
            ) : null}
          </svg>
          <span aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            {done ? <GoalTick day={t.day} /> : <b className="font-mono text-lg font-bold text-ink">{t.xp}</b>}
            <span className="text-[11px] text-ink-muted">{done ? `${t.xp} XP` : `of ${t.goal} XP`}</span>
          </span>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-display text-base font-bold text-ink">
            {t.streak > 0 && !done ? <Flame aria-hidden="true" className="h-4 w-4 shrink-0 text-saffron" /> : null}
            {title}
          </p>
          <p className={cn("mt-0.5 text-sm", safe && !done && !t.atRisk && t.streak > 0 ? "font-semibold text-success" : "text-ink")}>{line}</p>
          {!done && safe ? <p className="mt-0.5 text-xs text-ink-muted">{t.goal - t.xp} more XP fills today&apos;s goal.</p> : null}
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-7 gap-1" aria-label="This week">
        {t.week.map((d) => (
          <li key={d.day} className="flex flex-col items-center gap-1 text-[11px] text-ink-muted">
            <span
              aria-hidden="true"
              className={cn(
                "grid h-[30px] w-[30px] place-items-center rounded-full text-[11px] font-semibold",
                DOT[d.state],
                d.today && d.state !== "open" && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
              )}
            >
              {d.state === "met" ? <Check className="h-4 w-4" strokeWidth={3} /> : d.state === "learned" ? <span className="h-2 w-2 rounded-full bg-success" /> : d.state === "open" ? d.label.slice(0, 1) : null}
            </span>
            <span aria-hidden="true">{d.today ? "Today" : d.label}</span>
            <span className="sr-only">{d.name}{d.today ? " (today)" : ""}: {SAY[d.state]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap justify-between gap-x-3 text-xs text-ink-muted">
        <span>Week goal: <b className="text-ink">{t.weekMet} of {t.weeklyGoal} days</b></span>
        <Link href="/settings#daily-goal" className="font-medium text-accent-dark hover:underline">Goal: {t.goal} XP a day</Link>
      </p>
    </Card>
  );
}
