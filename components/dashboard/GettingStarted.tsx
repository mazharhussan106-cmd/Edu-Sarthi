// Owns the "Getting started" checklist a new student sees instead of the
// progress cards: four short steps (three and "Keep your progress" for a
// guest), each ticked from real data in lib/dashboard.
//
// It exists because the first week decides whether a learner stays, and a
// page of empty charts tells a new student nothing about what to do.

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Step } from "@/lib/dashboard";
import { Tick } from "@/components/dashboard/TodayTasks";

export function GettingStarted({ steps }: { steps: readonly Step[] }) {
  const done = steps.filter((s) => s.done).length;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>Getting started</CardTitle>
        <span className="text-sm text-ink-muted">{done} of {steps.length}</span>
      </div>
      <ul className="mt-2 divide-y divide-border">
        {steps.map((s) => {
          const body = (
            <>
              <Tick done={s.done} />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px] font-medium", s.done ? "text-ink-muted line-through" : s.href ? "text-ink" : "text-ink-muted")}>
                  {s.label}
                  {s.done ? <span className="sr-only"> (done)</span> : null}
                </span>
                {s.sub && !s.done ? <span className="block text-sm text-ink-muted">{s.sub}</span> : null}
              </span>
              {s.xp && !s.done ? <span className="font-mono text-xs font-semibold text-accent-dark">+{s.xp} XP</span> : null}
            </>
          );
          return (
            <li key={s.label}>
              {s.href && !s.done ? (
                <Link href={s.href} className="flex min-h-14 items-center gap-3 py-2 hover:bg-hover">
                  {body}
                  <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-muted" />
                </Link>
              ) : (
                <div className="flex min-h-14 items-center gap-3 py-2">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
