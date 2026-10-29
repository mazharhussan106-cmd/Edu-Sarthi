// Owns "Your skills" on the student's audit: each skill's score, band word,
// what the skill means, and how it moved since the last audit, then the
// "Focus next" and "Strongest" line.
//
// It deliberately shows movement as a symbol and words as well as colour
// (▲ +1, ▼ −2, same), so it reads the same for colour-blind students and in
// the high-contrast theme. It stays on the server: nothing here is interactive.

import { Card, CardTitle } from "@/components/ui/Card";
import type { SkillRow } from "@/lib/auditReport";

function Change({ change }: { change: number | null }) {
  if (change === null) return null;
  if (change === 0) {
    return <span className="text-xs text-ink-muted">same<span className="sr-only"> as your last audit</span></span>;
  }
  const up = change > 0;
  return (
    <span className={up ? "text-xs font-medium text-success" : "text-xs font-medium text-error"}>
      <span aria-hidden="true">{up ? "▲ +" : "▼ −"}{Math.abs(change)}</span>
      <span className="sr-only">{up ? "up" : "down"} {Math.abs(change)} since your last audit</span>
    </span>
  );
}

export function AuditSkills({
  rows,
  focus,
}: {
  rows: readonly SkillRow[];
  focus: { focus: string[]; strongest: string[]; low: number; high: number } | null;
}) {
  const compared = rows.some((r) => r.change !== null);
  return (
    <Card className="p-4 sm:p-6">
      <CardTitle>Your skills</CardTitle>
      <p className="mt-1 text-xs text-ink-muted">
        Each out of 10{compared ? ", with the change since your last audit" : ""}.
      </p>

      <ul className="mt-4 flex flex-col gap-4">
        {rows.map((r) => (
          <li key={r.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{r.label}</span>
              <span className="flex shrink-0 items-baseline gap-2">
                <Change change={r.change} />
                <span className="font-mono text-ink">{r.score}/10</span>
                <span className="text-xs text-ink-muted">{r.band}</span>
              </span>
            </div>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-dim"
              role="img"
              aria-label={`${r.label}: ${r.score} out of 10, ${r.band}`}
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${r.score * 10}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink-muted">{r.meaning}</p>
          </li>
        ))}
      </ul>

      {focus ? (
        <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-muted">Focus next</dt>
            <dd className="font-medium text-ink">
              {focus.focus.join(", ")} <span className="font-mono text-ink-muted">({focus.low}/10)</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-muted">Strongest</dt>
            <dd className="font-medium text-ink">
              {focus.strongest.join(", ")} <span className="font-mono text-ink-muted">({focus.high}/10)</span>
            </dd>
          </div>
        </dl>
      ) : null}
    </Card>
  );
}
