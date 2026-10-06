// Owns the compliance page (spec A-06): the recording retention policy with a
// manual purge, the record of students' data requests under India's DPDP Act,
// and the full admin activity log.
//
// Students export and erase their own data from their profile, so there is no
// approval queue here — requests complete immediately, and this page is the
// record that they did. Consent logging is not built; it is listed as a gap
// rather than shown as a number.

import { prisma } from "@/lib/prisma";
import { countPurgeable, retentionDays } from "@/lib/retention";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { ActionButton } from "@/components/admin/ActionButton";
import { ensureActiveUser } from "@/lib/activeUser";

export const revalidate = 0;

const DPDP_ACTIONS = ["Student exported own data", "Student deleted own account"];

export default async function CompliancePage() {
  // Re-checked in the page itself: a layout is not re-run on a client-side
  // navigation, and the role in the token can be older than a demotion.
  await ensureActiveUser(["ADMIN"]);
  const days = retentionDays();
  const [purgeable, purgedTotal, lastPurge, requests, requestCounts, logs] = await Promise.all([
    countPurgeable(),
    prisma.submission.count({ where: { mediaPurgedAt: { not: null } } }),
    prisma.adminLog.findFirst({ where: { action: "Purged recordings" }, orderBy: { createdAt: "desc" }, select: { createdAt: true, actorId: true } }),
    prisma.adminLog.findMany({
      where: { action: { in: DPDP_ACTIONS } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, action: true, targetId: true, createdAt: true },
    }),
    prisma.adminLog.groupBy({ by: ["action"], where: { action: { in: DPDP_ACTIONS } }, _count: true }),
    prisma.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, action: true, targetType: true, targetId: true, detail: true, createdAt: true, actor: { select: { email: true } } },
    }),
  ]);
  const countOf = (a: string) => requestCounts.find((r) => r.action === a)?._count ?? 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Compliance</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge variant="success">Self-service data export</Badge>
        <Badge variant="success">Self-service account erasure</Badge>
        <Badge variant="success">{days}-day recording retention</Badge>
        <Badge variant="error">Consent logging not built</Badge>
        <Badge variant="error">Legal pages need a lawyer</Badge>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Recording retention</CardTitle>
          <p className="mt-2 text-sm text-ink-muted">
            Audio and video from finished submissions are deleted after {days} days. Scores, notes and summaries
            are kept. Runs daily at 02:00 IST; set <code className="font-mono text-xs">AUDIO_RETENTION_DAYS</code> to change it.
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <dt className="text-xs text-ink-muted">Due for deletion</dt>
              <dd className="font-mono text-xl font-bold text-ink">{purgeable}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Deleted so far</dt>
              <dd className="font-mono text-xl font-bold text-ink">{purgedTotal}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Last run</dt>
              <dd className="text-sm text-ink">
                {lastPurge ? `${lastPurge.createdAt.toLocaleString("en-IN")}${lastPurge.actorId ? "" : " (scheduled)"}` : "Never"}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <ActionButton
              url="/api/admin/compliance"
              body={{ action: "purge" }}
              label="Run purge now"
              busyLabel="Deleting…"
              confirmWord="PURGE"
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Student data requests</CardTitle>
          <p className="mt-2 text-sm text-ink-muted">
            Completed by students from their profile. Recorded by student ID only.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-ink-muted">Data exports</dt>
              <dd className="font-mono text-xl font-bold text-ink">{countOf(DPDP_ACTIONS[0])}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Accounts erased</dt>
              <dd className="font-mono text-xl font-bold text-ink">{countOf(DPDP_ACTIONS[1])}</dd>
            </div>
          </dl>
          {requests.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-1.5 text-sm">
              {requests.slice(0, 6).map((r) => (
                <li key={r.id} className="flex justify-between gap-3">
                  <span className="text-ink">
                    {r.action} <span className="font-mono text-xs text-ink-muted">{r.targetId ?? ""}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-muted">{r.createdAt.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>

      <Card className="mt-4" id="log">
        <CardTitle>Admin activity log</CardTitle>
        <p className="mt-1 text-xs text-ink-muted">Latest 100 entries.</p>
        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Nothing logged yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-ink-muted">
                  <th className="py-2 font-medium">When</th>
                  <th className="py-2 font-medium">Who</th>
                  <th className="py-2 font-medium">Action</th>
                  <th className="py-2 font-medium">Target</th>
                  <th className="py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((l) => (
                  <tr key={l.id} className="align-top">
                    <td className="py-2 pr-3 text-xs text-ink-muted">{l.createdAt.toLocaleString("en-IN")}</td>
                    <td className="py-2 pr-3 text-xs text-ink">{l.actor?.email ?? "System"}</td>
                    <td className="py-2 pr-3 text-ink">{l.action}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-ink-muted">
                      {l.targetType} {l.targetId ? `…${l.targetId.slice(-8)}` : ""}
                    </td>
                    <td className="max-w-80 break-words py-2 font-mono text-[11px] text-ink-muted">
                      {l.detail ? JSON.stringify(l.detail) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
