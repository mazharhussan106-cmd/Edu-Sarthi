// Owns "Your skills" on the student dashboard: each rubric score's average
// across the student's audits as a bar, how it moved from the first audit to
// the latest, and the lowest one picked out with a way to practise.
//
// It compares the student only with themselves. Research on learning
// dashboards finds that peer averages discourage students above and below
// them (docs/DASHBOARD-PLAN.md), so no class average appears here.

import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type SkillRow = { label: string; mean: number; change: number };

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function SkillsCard({ rows, audits, member }: { rows: readonly SkillRow[]; audits: number; member: boolean }) {
  if (!member) return null;
  const lowest = rows.length > 0 ? rows.reduce((a, b) => (b.mean < a.mean ? b : a)) : null;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>Your skills</CardTitle>
        {audits > 0 ? <span className="text-sm text-ink-muted">from {audits} audit{audits === 1 ? "" : "s"}</span> : null}
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">
          After your first audit, your five scores show here: pronunciation, grammar, fluency, vocabulary and confidence.
        </p>
      ) : (
        <>
          <ul className="mt-3">
            {rows.map((r) => (
              <li
                key={r.label}
                className={cn(
                  "grid min-h-9 grid-cols-[6.5rem_1fr_2rem_2.25rem] items-center gap-2.5 text-sm",
                  r === lowest && "-mx-2 rounded-lg bg-saffron/12 px-2 font-semibold",
                )}
              >
                <span className="text-ink">{r.label}</span>
                <span className="block h-2 overflow-hidden rounded-full bg-paper-dim" aria-hidden="true">
                  <span className={cn("block h-full rounded-full", r === lowest ? "bg-saffron" : "bg-accent")} style={{ width: `${r.mean * 10}%` }} />
                </span>
                <span className="font-mono text-ink">{fmt(Math.round(r.mean * 10) / 10)}</span>
                <span className={cn("text-right font-mono text-xs", r.change > 0 ? "text-success" : "text-ink-muted")}>
                  {r.change > 0 ? "+" : ""}{r.change}
                  <span className="sr-only"> since your first audit</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink">
            {lowest!.label} is your lowest. <span className="text-ink-muted">Bars are your average; the last column is the change from your first audit to your latest.</span>
          </p>
        </>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/modules" className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent">
          Practise speaking
        </Link>
        {rows.length > 0 ? (
          <Link href="/progress" className="inline-flex min-h-10 items-center rounded-lg border border-border-strong px-4 text-sm font-semibold text-accent-dark hover:bg-hover">
            Full progress
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
