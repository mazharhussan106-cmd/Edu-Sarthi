// Owns the two small pills beside the dashboard greeting: the streak and the
// XP with its stage.
//
// Plain text for now. Phase 2 of docs/DASHBOARD-PLAN.md turns them into
// buttons that open the streak and XP sheets; until those exist, a pill that
// looked pressable and did nothing would be a broken promise.

import { Flame, Star } from "lucide-react";

export function StatPills({ streak, xp, stage }: { streak: number; xp: number; stage: number }) {
  const pill = "inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-semibold text-ink";
  return (
    <p className="flex flex-wrap gap-2">
      <span className={pill}>
        <Flame aria-hidden="true" className="h-4 w-4 text-saffron" />
        {streak} <span className="font-medium text-ink-muted">day{streak === 1 ? "" : "s"}<span className="sr-only"> streak</span></span>
      </span>
      <span className={pill}>
        <Star aria-hidden="true" className="h-4 w-4 text-accent" />
        {xp.toLocaleString("en-IN")} <span className="font-medium text-ink-muted">XP · Stage {stage}</span>
      </span>
    </p>
  );
}
