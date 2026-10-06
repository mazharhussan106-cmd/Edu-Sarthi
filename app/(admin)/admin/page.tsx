// Owns the admin overview (spec A-01): queue health first — depth, SLA
// breaches, who is reviewing — then activity over two weeks and the latest
// admin actions.
//
// The Azure-cost-versus-revenue panel from the spec is absent on purpose:
// there is no AI evaluation and no revenue yet, and a chart of zeros invites
// the wrong conclusion.

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { overviewStats } from "@/lib/adminStats";
import { SLA_HOURS } from "@/lib/claims";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ensureActiveUser } from "@/lib/activeUser";

export const revalidate = 0;

/// Past this many unclaimed submissions the queue card turns red.
const QUEUE_ALERT = 100;

export default async function AdminOverviewPage() {
  // Re-checked in the page itself: a layout is not re-run on a client-side
  // navigation, and the role in the token can be older than a demotion.
  await ensureActiveUser(["ADMIN"]);
  const [s, logs, decksPending, decksReported, institutesPending] = await Promise.all([
    overviewStats(14),
    prisma.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, action: true, targetType: true, targetId: true, createdAt: true, actor: { select: { email: true } } },
    }),
    prisma.deck.count({ where: { visibility: "PUBLIC", status: "PENDING_REVIEW" } }),
    prisma.deck.count({ where: { reports: { some: { resolvedAt: null } } } }),
    prisma.institute.count({ where: { status: "PENDING" } }),
  ]);
  const peak = Math.max(1, ...s.series.map((d) => Math.max(d.sent, d.audited)));

  const tiles = [
    { label: "Waiting in queue", value: s.pending, alert: s.pending > QUEUE_ALERT, href: "/admin/dispatch" },
    { label: `Over ${SLA_HOURS}h SLA`, value: s.overSla, alert: s.overSla > 0, href: "/admin/dispatch?view=sla" },
    { label: "Being reviewed", value: s.inReview, href: "/admin/dispatch?view=review" },
    { label: "Decks to review", value: decksPending, alert: decksReported > 0, sub: `${decksReported} reported`, href: "/admin/decks" },
    { label: "Institute applications", value: institutesPending, href: "/admin/institutes" },
    { label: "Teachers active (24h)", value: s.activeTeachers },
    { label: "Audits sent (24h)", value: s.auditsToday },
    { label: "Students who sent work", value: `${s.studentsToday} / ${s.studentsWeek}`, sub: "today / 7 days" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Overview</h1>
          <p className="mt-1 text-sm text-ink-muted">Live from the database on every load.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="inline-flex h-8 items-center rounded-lg border border-border-strong px-3 text-xs text-ink hover:bg-hover">
            Refresh
          </Link>
          {/* A plain link: the route answers with a CSV download. */}
          <a href="/api/admin/export" className="inline-flex h-8 items-center rounded-lg border border-border-strong px-3 text-xs text-ink hover:bg-hover">
            Export 30 days (CSV)
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-8">
        {tiles.map((t) => {
          const body = (
            <Card className={cn("h-full p-4", t.alert && "border-error/40 bg-error/10")}>
              <p className={cn("font-mono text-2xl font-bold", t.alert ? "text-error" : "text-ink")}>{t.value}</p>
              <p className="mt-1 text-xs text-ink-muted">{t.label}</p>
              {t.sub ? <p className="text-[11px] text-ink-muted">{t.sub}</p> : null}
            </Card>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="block hover:opacity-90">
              {body}
            </Link>
          ) : (
            <div key={t.label}>{body}</div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Last 14 days</CardTitle>
            <p className="flex gap-4 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />Submissions</span>
              <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-success" />Audits</span>
            </p>
          </div>
          <div
            className="mt-4 flex h-52 items-end gap-1.5 border-b border-border"
            role="img"
            aria-label={s.series.map((d) => `${d.day}: ${d.sent} sent, ${d.audited} audited`).join("; ")}
          >
            {s.series.map((d) => (
              <div key={d.day} className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5">
                <div className="w-1/2 max-w-4 rounded-t bg-accent" style={{ height: `${(d.sent / peak) * 90}%`, minHeight: d.sent ? 3 : 0 }} />
                <div className="w-1/2 max-w-4 rounded-t bg-success" style={{ height: `${(d.audited / peak) * 90}%`, minHeight: d.audited ? 3 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5">
            {s.series.map((d) => (
              <span key={d.day} className="min-w-0 flex-1 text-center font-mono text-[10px] text-ink-muted">
                {d.day.slice(8)}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Recent admin actions</CardTitle>
            <Link href="/admin/compliance#log" className="text-xs text-accent hover:underline">
              Full log
            </Link>
          </div>
          {logs.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Nothing yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {logs.map((l) => (
                <li key={l.id} className="text-sm">
                  <span className="text-ink">{l.action}</span>{" "}
                  <span className="text-ink-muted">
                    · {l.targetType} {l.targetId ? l.targetId.slice(-8) : ""}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {l.actor?.email ?? "System"} · {l.createdAt.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
