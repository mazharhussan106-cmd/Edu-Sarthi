// Owns the teacher's workload page (spec T-05, without payouts): audits per
// day, how many met the 24-hour SLA, typical turnaround, and send-backs.
//
// Earnings and payouts are deliberately absent. Payments are scheduled for
// launch; showing a balance before there is a payout system would be a number
// nobody can act on.
//
// Days are bucketed in India time, same as the student streak, so an audit at
// 11 pm IST lands on the day the teacher did it.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SLA_HOURS } from "@/lib/claims";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ensureActiveUser } from "@/lib/activeUser";

export const revalidate = 0;

const IST_MS = 5.5 * 3_600_000;
const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
] as const;

function dayKey(d: Date): string {
  return new Date(d.getTime() + IST_MS).toISOString().slice(0, 10);
}

function hours(ms: number): string {
  const h = ms / 3_600_000;
  return h < 1 ? `${Math.round(h * 60)}m` : `${h.toFixed(1)}h`;
}

export default async function WorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  // Re-checked in the page itself: a layout is not re-run on a client-side
  // navigation, and the role in the token can be older than a demotion.
  await ensureActiveUser(["TEACHER", "ADMIN"]);
  const sp = await searchParams;
  const days = sp.days === "30" ? 30 : 7;
  const session = await auth();
  const teacherId = session?.user?.id;
  const since = new Date(Date.now() - days * 86_400_000);

  const [audits, sentBack] = await Promise.all([
    prisma.feedback.findMany({
      where: { teacherId, createdAt: { gte: since } },
      select: { createdAt: true, submission: { select: { createdAt: true, claimedAt: true } } },
    }),
    // Send-backs keep the claim on the row, which is how they are counted.
    prisma.submission.count({
      where: { claimedById: teacherId, status: "RETURNED", claimedAt: { gte: since } },
    }),
  ]);

  const turnaround = audits.map((a) => a.createdAt.getTime() - a.submission.createdAt.getTime());
  const onTime = turnaround.filter((t) => t <= SLA_HOURS * 3_600_000).length;
  const sorted = [...turnaround].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
  const working = audits
    .filter((a) => a.submission.claimedAt)
    .map((a) => a.createdAt.getTime() - a.submission.claimedAt!.getTime())
    .filter((t) => t > 0);
  const avgWorking = working.length ? working.reduce((t, x) => t + x, 0) / working.length : null;

  const perDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) perDay.set(dayKey(new Date(Date.now() - i * 86_400_000)), 0);
  for (const a of audits) {
    const k = dayKey(a.createdAt);
    if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }
  const bars = [...perDay.entries()];
  const peak = Math.max(1, ...bars.map(([, n]) => n));

  const tiles = [
    { label: "Audits sent", value: String(audits.length) },
    {
      label: `Within ${SLA_HOURS}h SLA`,
      value: audits.length ? `${Math.round((onTime / audits.length) * 100)}%` : "—",
      tone: audits.length && onTime / audits.length < 0.9 ? "text-error" : "text-success",
    },
    { label: "Median turnaround", value: median !== null ? hours(median) : "—" },
    { label: "Avg time per audit", value: avgWorking !== null ? hours(avgWorking) : "—" },
    { label: "Sent back", value: String(sentBack) },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Workload</h1>
          <p className="mt-1 text-sm text-ink-muted">Your audits over the last {days} days.</p>
        </div>
        <nav aria-label="Range" className="flex gap-1">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/workload?days=${r.value}`}
              aria-current={String(days) === r.value ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                String(days) === r.value
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border-strong text-ink hover:bg-hover",
              )}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <p className={cn("font-mono text-2xl font-bold text-ink", t.tone)}>{t.value}</p>
            <p className="mt-1 text-xs text-ink-muted">{t.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardTitle>Audits per day</CardTitle>
        {audits.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No audits in this range yet.</p>
        ) : (
          <div
            className="mt-4 flex h-48 items-end gap-1 border-b border-border"
            role="img"
            aria-label={`Audits per day: ${bars.map(([d, n]) => `${d} ${n}`).join(", ")}`}
          >
            {bars.map(([d, n]) => (
              <div key={d} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                {n > 0 ? <span className="font-mono text-[10px] text-ink-muted">{n}</span> : null}
                <div
                  className="w-full max-w-10 rounded-t bg-success/80"
                  style={{ height: `${(n / peak) * 85}%`, minHeight: n > 0 ? 3 : 0 }}
                />
              </div>
            ))}
          </div>
        )}
        {audits.length > 0 ? (
          <div className="mt-1 flex gap-1">
            {bars.map(([d]) => (
              <span key={d} className="min-w-0 flex-1 truncate text-center font-mono text-[10px] text-ink-muted">
                {days <= 7 ? d.slice(5) : d.slice(8)}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      <p className="mt-4 text-xs text-ink-muted">
        Earnings and payouts will appear here once payments are set up.
      </p>
    </main>
  );
}
