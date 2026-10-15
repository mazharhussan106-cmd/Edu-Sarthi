// Owns the per-criterion movement: first audit against latest, for each of the
// five rubric scores.
//
// The ScoreTrend chart shows only the average, because five lines on a phone
// is noise. This answers the next question, "which skill moved?", as five
// short rows with the change written out.

import type { CriterionChange } from "@/lib/studentStats";

export function CriteriaChange({ rows }: { rows: readonly CriterionChange[] | null }) {
  if (!rows) {
    return <p className="text-sm text-ink-muted">After your second audit, this shows how each skill moved since your first.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => {
        const diff = r.latest - r.first;
        return (
          <li key={r.label} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-ink">{r.label}</span>
            <span className="font-mono text-xs text-ink-muted">
              {r.first} → <b className="text-ink">{r.latest}</b>{" "}
              <span className={diff > 0 ? "text-success" : diff < 0 ? "text-error" : ""}>
                ({diff > 0 ? "+" : ""}{diff})
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
