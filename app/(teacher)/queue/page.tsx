// Owns the review queue (spec T-02): tabs for Urgent, All pending and Claimed
// by me, and one row per submission with the student's anonymized ID, level,
// how long it has waited and the time left on its 24-hour SLA.
//
// Claiming is an explicit button press. It holds the submission for 30
// minutes; the teacher can release it early, and an expired claim returns to
// the queue on its own the next time anyone loads this page.
//
// Oldest first in every tab. Newest-first quietly starves the back of the
// queue.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayId } from "@/lib/publicId";
import {
  CLAIM_MINUTES,
  claimExpiresAt,
  releaseExpiredClaims,
  slaDueAt,
  urgentBefore,
} from "@/lib/claims";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ClaimButton, ClaimTimer, ReleaseButton } from "@/components/review/ClaimControls";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const TABS = [
  { value: "urgent", label: "Urgent" },
  { value: "all", label: "All pending" },
  { value: "mine", label: "Claimed by me" },
] as const;
type Tab = (typeof TABS)[number]["value"];

function duration(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60_000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ${mins % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

const ROW_SELECT = {
  id: true,
  createdAt: true,
  claimedAt: true,
  mediaKind: true,
  durationSec: true,
  student: { select: { publicId: true } },
  exercise: { select: { title: true, module: { select: { level: true } } } },
} as const;

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const teacherId = session?.user?.id;

  const released = await releaseExpiredClaims();
  const now = new Date();
  const urgentCutoff = urgentBefore(now);

  const [urgentCount, pendingCount, mine] = await Promise.all([
    prisma.submission.count({ where: { status: "PENDING", createdAt: { lt: urgentCutoff } } }),
    prisma.submission.count({ where: { status: "PENDING" } }),
    prisma.submission.findMany({
      where: { claimedById: teacherId, status: "IN_REVIEW" },
      orderBy: { claimedAt: "asc" },
      select: ROW_SELECT,
    }),
  ]);

  // Default to Urgent only when something is urgent; an empty first tab reads
  // as "nothing to do" when the queue is actually full.
  const tab: Tab = TABS.some((t) => t.value === params.tab)
    ? (params.tab as Tab)
    : urgentCount > 0
      ? "urgent"
      : "all";

  const rows =
    tab === "mine"
      ? mine
      : await prisma.submission.findMany({
          where: {
            status: "PENDING",
            ...(tab === "urgent" ? { createdAt: { lt: urgentCutoff } } : {}),
          },
          orderBy: { createdAt: "asc" },
          take: 100,
          select: ROW_SELECT,
        });

  const counts: Record<Tab, number> = { urgent: urgentCount, all: pendingCount, mine: mine.length };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Review queue</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {pendingCount} waiting · {urgentCount} urgent · {mine.length} claimed by you
          </p>
        </div>
        <Link
          href={`/queue?tab=${tab}`}
          className="inline-flex h-8 items-center rounded-lg border border-border-strong px-3 text-xs text-ink hover:bg-hover"
        >
          Refresh
        </Link>
      </div>

      {released > 0 ? (
        <p role="status" className="mt-4 rounded-lg bg-accent/12 px-3 py-2 text-sm text-accent">
          {released} claim{released === 1 ? "" : "s"} ran past {CLAIM_MINUTES} minutes and went back
          to the queue.
        </p>
      ) : null}

      <nav aria-label="Queue tabs" className="mt-6 flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/queue?tab=${t.value}`}
            aria-current={tab === t.value ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              tab === t.value
                ? "border-accent font-medium text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
            <span className="ml-1.5 font-mono text-xs text-mist">{counts[t.value]}</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-ink-muted">
            {tab === "mine"
              ? "You have nothing claimed. Claim a submission from All pending."
              : tab === "urgent"
                ? "Nothing is close to its 24-hour deadline."
                : "No submissions are waiting. New ones appear here as students send them."}
          </p>
        </Card>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Exercise</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Waiting</th>
                <th className="px-4 py-3 font-medium">SLA</th>
                <th className="px-4 py-3 font-medium">Media</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((s) => {
                const dueIn = slaDueAt(s.createdAt).getTime() - now.getTime();
                return (
                  <tr key={s.id} className={cn(tab === "mine" && "bg-success/5")}>
                    <td className="px-4 py-3 font-mono text-xs text-ink">
                      {displayId(s.student.publicId)}
                    </td>
                    <td className="max-w-64 truncate px-4 py-3 text-ink">{s.exercise.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">L{s.exercise.module.level}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                      {duration(now.getTime() - s.createdAt.getTime())}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 font-mono text-xs",
                        dueIn <= 0 ? "text-error" : dueIn < 4 * 3_600_000 ? "text-error" : "text-ink-muted",
                      )}
                    >
                      {dueIn <= 0 ? `${duration(-dueIn)} over` : `${duration(dueIn)} left`}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {s.mediaKind.toLowerCase()}
                      {s.durationSec ? ` · ${s.durationSec}s` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {tab === "mine" && s.claimedAt ? (
                        <div className="flex items-center justify-end gap-2">
                          <ClaimTimer
                            expiresAt={claimExpiresAt(s.claimedAt).toISOString()}
                            minutes={CLAIM_MINUTES}
                          />
                          <Link
                            href={`/review/${s.id}`}
                            className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-xs font-medium text-on-accent hover:bg-accent-dark"
                          >
                            Continue
                          </Link>
                          <ReleaseButton submissionId={s.id} />
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <ClaimButton submissionId={s.id} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
