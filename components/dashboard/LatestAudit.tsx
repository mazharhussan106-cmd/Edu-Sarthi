// Owns the "latest audit" card on the dashboard: the five scores, the
// teacher's summary trimmed, and the way into the full audit.

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CRITERIA, type CriterionKey } from "@/lib/studentStats";

export type LatestAuditData = {
  id: string;
  createdAt: Date;
  exercise: { title: string };
  feedback: Record<CriterionKey, number> & { summary: string };
};

export function LatestAudit({ latest }: { latest: LatestAuditData }) {
  return (
      <Card>
        <CardTitle>Your latest audit</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">
          {latest.exercise.title} ·{" "}
          {latest.createdAt.toLocaleDateString("en-IN")}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CRITERIA.map((c) => (
            <div key={c.key}>
              <p className="font-mono text-lg font-bold text-ink">
                {latest.feedback[c.key]}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-ink-muted">
                {c.label}
              </p>
            </div>
          ))}
        </div>
        {/* The teacher's own words, trimmed: the full audit with its
            timestamped notes is one tap away. */}
        <p className="mt-4 line-clamp-3 text-sm text-ink-muted">“{latest.feedback.summary}”</p>
        <Link href={`/feedback/${latest.id}`} className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            Read it in full
          </Button>
        </Link>
      </Card>
  );
}
