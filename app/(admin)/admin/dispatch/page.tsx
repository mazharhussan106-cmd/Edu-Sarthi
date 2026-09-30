// Owns the dispatch manager (spec A-02): every submission in the pipeline,
// filterable by state, with reassign, force-unlock and QA flag actions.
//
// It deliberately does NOT release expired claims on load, unlike the teacher
// queue. "Blocked" is exactly the list of claims that ran out, and an admin
// opening this page needs to see them before anything tidies them away.

import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { displayId } from "@/lib/publicId";
import { CLAIM_MINUTES, SLA_HOURS } from "@/lib/claims";
import { STATUS_BADGE } from "@/lib/audits";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ActionButton } from "@/components/admin/ActionButton";
import { ReassignForm } from "@/components/admin/ReassignForm";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const PAGE = 25;
const VIEWS = [
  { value: "live", label: "Live" },
  { value: "review", label: "In review" },
  { value: "blocked", label: "Blocked" },
  { value: "sla", label: `Over ${SLA_HOURS}h` },
  { value: "done", label: "Completed (30d)" },
] as const;
type View = (typeof VIEWS)[number]["value"];

function ago(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60_000));
  return m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
}

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const view: View = VIEWS.some((v) => v.value === sp.view) ? (sp.view as View) : "live";
  const q = (sp.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number(sp.page) || 1);
  const now = Date.now();
  const lockCutoff = new Date(now - CLAIM_MINUTES * 60_000);

  const byView: Record<View, Prisma.SubmissionWhereInput> = {
    live: { status: { in: ["PENDING", "IN_REVIEW"] } },
    review: { status: "IN_REVIEW", claimedAt: { gte: lockCutoff } },
    blocked: { status: "IN_REVIEW", claimedAt: { lt: lockCutoff } },
    sla: { status: { in: ["PENDING", "IN_REVIEW"] }, createdAt: { lt: new Date(now - SLA_HOURS * 3_600_000) } },
    done: { status: "REVIEWED", createdAt: { gte: new Date(now - 30 * 86_400_000) } },
  };
  const where: Prisma.SubmissionWhereInput = {
    ...byView[view],
    ...(q
      ? {
          OR: [
            { student: { publicId: { contains: q, mode: "insensitive" } } },
            { claimedBy: { email: { contains: q, mode: "insensitive" } } },
            { id: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, rows, teachers] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: view === "done" ? "desc" : "asc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: {
        id: true,
        status: true,
        createdAt: true,
        claimedAt: true,
        claimedById: true,
        student: { select: { publicId: true } },
        claimedBy: { select: { email: true, name: true } },
        feedback: { select: { qaFlaggedAt: true, qaNote: true, teacher: { select: { email: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["TEACHER", "ADMIN"] }, suspendedAt: null },
      orderBy: { email: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  const teacherOptions = teachers.map((t) => ({ id: t.id, label: t.name ?? t.email ?? t.id }));
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: Partial<{ view: string; q: string; page: number }>) => {
    const u = new URLSearchParams({ view: p.view ?? view, ...((p.q ?? q) ? { q: p.q ?? q } : {}), page: String(p.page ?? 1) });
    return `/admin/dispatch?${u}`;
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Dispatch</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {total} submission{total === 1 ? "" : "s"} in this view. Claims hold for {CLAIM_MINUTES} minutes.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <nav aria-label="Views" className="flex gap-1">
          {VIEWS.map((v) => (
            <Link
              key={v.value}
              href={link({ view: v.value })}
              aria-current={view === v.value ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm",
                view === v.value ? "border-accent font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/dispatch" className="mb-2 flex gap-2">
          <input type="hidden" name="view" value={view} />
          <label htmlFor="dispatch-q" className="sr-only">Search</label>
          <input
            id="dispatch-q"
            name="q"
            defaultValue={q}
            placeholder="Student ID, teacher email, submission ID"
            className="h-8 w-72 rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink placeholder:text-mist"
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-ink-muted">Nothing in this view.</p>
        </Card>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-ink-muted">
                <th className="px-3 py-3 font-medium">Submission</th>
                <th className="px-3 py-3 font-medium">Sent</th>
                <th className="px-3 py-3 font-medium">Student</th>
                <th className="px-3 py-3 font-medium">Teacher</th>
                <th className="px-3 py-3 font-medium">Lock</th>
                <th className="px-3 py-3 font-medium">In pipeline</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const expired = r.status === "IN_REVIEW" && r.claimedAt !== null && r.claimedAt < lockCutoff;
                const teacher = r.claimedBy?.name ?? r.claimedBy?.email ?? r.feedback?.teacher.email ?? "—";
                return (
                  <tr key={r.id} className={cn(expired && "bg-error/5")}>
                    <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">…{r.id.slice(-8)}</td>
                    <td className="px-3 py-2.5 text-xs text-ink-muted">{r.createdAt.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-ink">{displayId(r.student.publicId)}</td>
                    <td className="px-3 py-2.5 text-xs text-ink">{teacher}</td>
                    <td className="px-3 py-2.5">
                      {r.status === "IN_REVIEW" ? (
                        <Badge variant={expired ? "error" : "accent"}>
                          {expired ? "Expired" : `${Math.max(0, CLAIM_MINUTES - Math.floor((now - r.claimedAt!.getTime()) / 60_000))}m left`}
                        </Badge>
                      ) : (
                        <Badge variant={STATUS_BADGE[r.status].variant}>{STATUS_BADGE[r.status].text}</Badge>
                      )}
                      {r.feedback?.qaFlaggedAt ? (
                        <Badge variant="error" className="ml-1" title={r.feedback.qaNote ?? undefined}>QA</Badge>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">{ago(now - r.createdAt.getTime())}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-start justify-end gap-2">
                        {r.status === "PENDING" || r.status === "IN_REVIEW" ? (
                          <ReassignForm submissionId={r.id} teachers={teacherOptions} current={r.claimedById} />
                        ) : null}
                        {r.status === "IN_REVIEW" ? (
                          <ActionButton
                            url="/api/admin/dispatch"
                            body={{ action: "unlock", submissionId: r.id }}
                            label="Force unlock"
                            busyLabel="Unlocking…"
                            // A live claim may be mid-submit; an expired one is not.
                            confirmWord={expired ? undefined : "UNLOCK"}
                          />
                        ) : null}
                        {r.status === "REVIEWED" ? (
                          r.feedback?.qaFlaggedAt ? (
                            <ActionButton url="/api/admin/dispatch" body={{ action: "unqa", submissionId: r.id }} label="Clear QA flag" />
                          ) : (
                            <ActionButton url="/api/admin/dispatch" body={{ action: "qa", submissionId: r.id }} label="Flag for QA" askReason />
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-end gap-2 text-xs text-ink-muted">
          {page > 1 ? <Link href={link({ page: page - 1 })} className="rounded-md border border-border-strong px-2 py-1 hover:bg-hover">Previous</Link> : null}
          <span>Page {page} of {pages}</span>
          {page < pages ? <Link href={link({ page: page + 1 })} className="rounded-md border border-border-strong px-2 py-1 hover:bg-hover">Next</Link> : null}
        </nav>
      ) : null}
    </main>
  );
}
