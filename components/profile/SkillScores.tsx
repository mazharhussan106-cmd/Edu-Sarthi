// Owns the Speaking scores card on the student Profile: one bar per rubric
// skill, out of 10, with how far it has moved from the first audit to the
// latest. The numbers are the dashboard's "Your skills" (lib/profileStats).
//
// It says plainly that these are teachers' scores and not an exam band.
// Showing an IELTS or CEFR "estimate" next to them would claim more than a
// rubric score can carry. It deliberately does NOT list audits; Progress does.

import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/Card";
import type { SkillScore } from "@/lib/profileStats";
import { cn } from "@/lib/utils";

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="w-12 shrink-0" />;
  const up = value > 0;
  const down = value < 0;
  return (
    <span className={cn("w-12 shrink-0 text-right font-mono text-xs font-bold", up ? "text-success" : down ? "text-error" : "text-ink-muted")}>
      <span aria-hidden="true">{up ? "▲" : down ? "▼" : "–"} </span>
      <span className="sr-only">{up ? "up " : down ? "down " : "no change, "}</span>
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

export function SkillScores({ scores, audits }: { scores: SkillScore[]; audits: number }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Speaking scores</CardTitle>
        <span className="text-xs text-ink-muted">out of 10</span>
      </div>
      {scores.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border-strong px-4 py-5 text-center text-sm text-ink-muted">
          Your five scores show here after your first audit.
          <Link href="/class" className="mt-1 block font-medium text-accent-dark hover:underline">
            Send a recording ›
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-3 flex flex-col gap-2.5">
            {scores.map((s) => (
              <li key={s.key} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-ink">{s.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper-dim" aria-hidden="true">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${s.now * 10}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right font-mono font-bold text-ink">{s.now.toFixed(1)}</span>
                <Change value={s.change} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-muted">
            {audits > 1
              ? `Bars are your average over ${audits > 50 ? "your newest 50" : "your"} audits; the arrow is the change from your first audit to your latest.`
              : "From your first audit. Arrows show from your second."}{" "}
            Teachers&apos; scores, not an exam band.
          </p>
          <Link href="/progress" className="mt-2 inline-block text-sm font-medium text-accent-dark hover:underline">
            See full progress ›
          </Link>
        </>
      )}
    </Card>
  );
}
