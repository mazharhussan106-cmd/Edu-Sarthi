// Owns the "With a teacher" card on the dashboard: submissions still waiting,
// being reviewed, or sent back.

import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";

const IN_FLIGHT_LABEL = {
  PENDING: "Waiting for a teacher",
  IN_REVIEW: "Being reviewed now",
  RETURNED: "Sent back — try again",
} as const;

export type InFlightItem = { id: string; status: string; createdAt: Date; exercise: { title: string } };

export function InFlightCard({ items }: { items: readonly InFlightItem[] }) {
  if (items.length === 0) return null;
  return (
      <Card>
        <CardTitle>With a teacher</CardTitle>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {items.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">
                  {s.exercise.title}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Sent {s.createdAt.toLocaleDateString("en-IN")}
                </p>
              </div>
              <Badge
                variant={s.status === "RETURNED" ? "error" : "neutral"}
              >
                {IN_FLIGHT_LABEL[s.status as keyof typeof IN_FLIGHT_LABEL]}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
  );
}
