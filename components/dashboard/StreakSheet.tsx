// Owns what the streak sheet shows when the 🔥 pill on the dashboard is
// tapped: the current and longest streak, this month as a calendar, the week
// against its goal, and the rule in plain words.
//
// A server component: StatPills (client) only opens and closes the sheet, and
// this markup is handed to it already rendered, so no data crosses to the
// browser as JSON. Past days with too little XP stay plain rather than marked
// as missed, so the calendar never scolds a student for days before they
// joined.

import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { STREAK_MIN_XP, type MonthDay } from "@/lib/streak";

const CELL: Record<MonthDay["state"], string> = {
  met: "bg-success font-semibold text-on-accent",
  // Ink, not green, on the light green: green text on it was 4.12:1 (axe).
  learned: "bg-success/15 font-semibold text-ink",
  none: "text-ink",
  future: "text-ink-muted",
};

const SAY: Record<MonthDay["state"], string> = {
  met: "daily goal met",
  learned: "streak day",
  none: "no streak day",
  future: "still to come",
};

export function StreakSheet({
  streak,
  longest,
  goal,
  weekMet,
  weeklyGoal,
  month,
}: {
  streak: number;
  longest: number;
  goal: number;
  weekMet: number;
  weeklyGoal: number;
  month: { title: string; lead: number; days: readonly MonthDay[] };
}) {
  return (
    <div>
      <p className="text-sm text-ink-muted">
        Longest: <b className="text-ink">{longest} day{longest === 1 ? "" : "s"}</b> · This week: <b className="text-ink">{weekMet} of {weeklyGoal} days</b> at your goal
      </p>

      <p className="mt-4 text-sm font-semibold text-ink">{month.title}</p>
      <div className="mt-2 grid grid-cols-7 gap-1.5 text-center text-xs" role="img" aria-label={`${month.title}: ${month.days.filter((d) => d.state === "met" || d.state === "learned").length} streak days so far`}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} aria-hidden="true" className="font-semibold text-ink-muted">{d}</span>
        ))}
        {Array.from({ length: month.lead }, (_, i) => <span key={`lead-${i}`} aria-hidden="true" />)}
        {month.days.map((d) => (
          <span
            key={d.day}
            aria-hidden="true"
            title={SAY[d.state]}
            className={cn("grid h-9 place-items-center rounded-lg", CELL[d.state], d.today && "ring-2 ring-accent ring-offset-1 ring-offset-surface-raised")}
          >
            {d.date}
          </span>
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-ink">
        <li className="flex gap-2.5">
          <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-on-accent"><Check className="h-3 w-3" strokeWidth={3} /></span>
          <span>A day counts for your streak when you earn {STREAK_MIN_XP} XP, India time. Today still counts until midnight.</span>
        </li>
        <li className="flex gap-2.5">
          <span aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-success/15" />
          <span>Light green is a streak day; dark green is a day you filled the ring ({goal} XP).</span>
        </li>
      </ul>
      {streak === 0 ? <p className="mt-3 text-sm text-ink-muted">Earn {STREAK_MIN_XP} XP today to start a new streak.</p> : null}
      <Link href="/settings#weekly-goal" className="mt-4 inline-block text-sm font-semibold text-accent-dark hover:underline">
        Change your daily or weekly goal
      </Link>
    </div>
  );
}
