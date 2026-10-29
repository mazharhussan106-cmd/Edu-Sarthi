// Owns the "Today's tasks" checklist on the student dashboard and the round
// tick its rows share with Getting started. Which rows exist and whether they
// are done is decided in lib/dashboardTasks; this only draws them.
//
// A done row stays visible, ticked and struck through: seeing what is already
// done is half of what makes a checklist worth opening.

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { TaskRow } from "@/lib/dashboardTasks";

export function Tick({ done, urgent }: { done: boolean; urgent?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-on-accent",
        done ? "border-success bg-success" : urgent ? "border-error" : "border-border-strong",
      )}
    >
      {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
    </span>
  );
}

export function TodayTasks({ rows }: { rows: readonly TaskRow[] }) {
  if (rows.length === 0) return null;
  const done = rows.filter((r) => r.done).length;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>Today&apos;s tasks</CardTitle>
        <span className="text-sm text-ink-muted">{done} of {rows.length} done</span>
      </div>
      <ul className="mt-2 divide-y divide-border">
        {rows.map((r) => (
          <li key={r.key}>
            <Link href={r.href} className="flex min-h-14 items-center gap-3 py-2 hover:bg-hover">
              <Tick done={r.done} urgent={r.urgent} />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px] font-medium", r.done ? "text-ink-muted line-through" : r.urgent ? "text-error" : "text-ink")}>
                  {r.label}
                  {r.done ? <span className="sr-only"> (done)</span> : null}
                </span>
                {r.sub ? <span className="block text-sm text-ink-muted">{r.sub}</span> : null}
              </span>
              {r.count !== undefined ? <span className="font-mono text-base font-bold text-ink">{r.count}</span> : null}
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
