// Owns the "Recent activity" card on the dashboard: the last three recordings
// with their audit status, today's card answers, and the way into the full
// History page.
//
// It reads its own data (a server component) so the dashboard page, already
// near the file-size limit, only has to place it. It deliberately shows no
// recordings to a guest: they cannot make any, and an empty list would only
// look like something is broken.

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { STATUS_BADGE } from "@/lib/audits";
import { practiceHistory, studyDays } from "@/lib/history";

const istDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export async function RecentHistory({ userId, isGuest }: { userId: string; isGuest: boolean }) {
  const [practice, days] = await Promise.all([
    isGuest ? null : practiceHistory(userId, { id: userId, role: "STUDENT" }, undefined, 3),
    // Caught so the whole dashboard still loads if Database setup has not yet
    // created the ReviewLog table after a deploy.
    studyDays(userId, 1).catch(() => []),
  ]);
  const answeredToday = days.find((d) => d.day === istDay(new Date()))?.answers ?? 0;

  return (
    <Card>
      <CardTitle>Recent activity</CardTitle>
      <p className="mt-1 text-sm text-ink-muted">
        {answeredToday > 0
          ? `${answeredToday} card${answeredToday === 1 ? "" : "s"} answered today.`
          : "No cards answered yet today."}
      </p>

      {practice && practice.items.length > 0 ? (
        <ul className="mt-3 divide-y divide-border">
          {practice.items.map((s) => {
            const badge = STATUS_BADGE[s.status];
            return (
              <li key={s.id}>
                <Link href={`/feedback/${s.id}`} className="flex items-center justify-between gap-3 py-2 hover:bg-hover">
                  <span className="min-w-0 truncate text-sm text-ink">{s.cardText ? `Card: ${s.cardText}` : s.title}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {s.average !== null ? <span className="font-mono text-sm font-bold text-ink">{s.average.toFixed(1)}</span> : null}
                    <Badge variant={badge.variant}>{badge.text}</Badge>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Link href="/history" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
        See full history
      </Link>
    </Card>
  );
}
