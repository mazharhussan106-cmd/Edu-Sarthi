// Owns "With your teacher" on the student dashboard: recordings still with a
// teacher, then the latest audit in short — its average, the move from the
// audit before, the five scores as small bars and the teacher's words
// trimmed. It replaces four cards that each showed recordings a different way.
//
// It renders nothing for a student with no recording and no audit (a guest,
// or someone new), whose page says how to start instead.

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { CRITERIA, type CriterionKey } from "@/lib/studentStats";

const STATUS = {
  PENDING: { text: "Waiting", variant: "neutral" },
  IN_REVIEW: { text: "Being reviewed", variant: "accent" },
  RETURNED: { text: "Sent back", variant: "error" },
} as const;

const SHORT: Record<CriterionKey, string> = { pronunciation: "Pron.", grammar: "Gram.", fluency: "Flu.", vocabulary: "Voc.", confidence: "Conf." };

const date = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export type LatestAuditData = {
  id: string;
  createdAt: Date;
  title: string;
  scores: Record<CriterionKey, number>;
  summary: string;
  average: number;
  previous: number | null;
};

export function TeacherCard({
  items,
  latest,
}: {
  items: readonly { id: string; status: string; createdAt: Date; title: string }[];
  latest: LatestAuditData | null;
}) {
  if (items.length === 0 && !latest) return null;
  const move = latest && latest.previous !== null ? latest.average - latest.previous : null;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>With your teacher</CardTitle>
        <Link href="/feedback" className="text-sm font-semibold text-accent-dark hover:underline">See all</Link>
      </div>
      <div className={latest && items.length > 0 ? "mt-2 grid grid-cols-1 gap-x-6 md:grid-cols-2" : "mt-2"}>
        {items.length > 0 ? (
          <ul className="divide-y divide-border">
            {items.slice(0, 3).map((s) => {
              const st = STATUS[s.status as keyof typeof STATUS] ?? STATUS.PENDING;
              return (
                <li key={s.id}>
                  <Link href={`/feedback/${s.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2 hover:bg-hover">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-ink">{s.title}</span>
                      <span className="block text-sm text-ink-muted">Sent {date(s.createdAt)}</span>
                    </span>
                    <Badge variant={st.variant}>{st.text}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {latest ? (
          <div className={items.length > 0 ? "mt-3 border-t border-border pt-3 md:mt-0 md:border-t-0 md:pt-0" : ""}>
            <p className="truncate text-sm text-ink-muted">Latest audit · {latest.title} · {date(latest.createdAt)}</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <b className="font-mono text-3xl font-bold text-ink">{latest.average.toFixed(1)}</b>
              <span className="text-ink-muted">/ 10</span>
              {move !== null && Math.abs(move) >= 0.05 ? (
                <span className={move > 0 ? "text-sm font-semibold text-success" : "text-sm font-semibold text-ink-muted"}>
                  {move > 0 ? "↑" : "↓"} {Math.abs(move).toFixed(1)} since the one before
                </span>
              ) : null}
            </p>
            <div
              className="mt-2 grid grid-cols-5 gap-2"
              role="img"
              aria-label={`Scores: ${CRITERIA.map((c) => `${c.label.toLowerCase()} ${latest.scores[c.key]}`).join(", ")}`}
            >
              {CRITERIA.map((c) => (
                <div key={c.key} aria-hidden="true" className="flex flex-col gap-1 text-[11px] text-ink-muted">
                  <span className="relative block h-10 overflow-hidden rounded-md bg-paper-dim">
                    <span className="absolute inset-x-0 bottom-0 rounded-md bg-accent" style={{ height: `${latest.scores[c.key] * 10}%` }} />
                  </span>
                  <b className="font-mono text-[13px] text-ink">{latest.scores[c.key]}</b>
                  {SHORT[c.key]}
                </div>
              ))}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-ink-muted">“{latest.summary}”</p>
            <Link
              href={`/feedback/${latest.id}`}
              className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-border-strong px-4 text-sm font-semibold text-accent-dark hover:bg-hover"
            >
              Read it in full
            </Link>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
