// Owns the admin Notices page: post an announcement to every student (a class,
// a deadline, a holiday) and remove the ones that are wrong or finished.
//
// Notices show on every student's dashboard. There is no per-batch targeting;
// until batches exist in the data, "everyone" is the only honest scope.

import { prisma } from "@/lib/prisma";
import { ensureActiveUser } from "@/lib/activeUser";
import { formatEvent } from "@/lib/notices";
import { Card, CardTitle } from "@/components/ui/Card";
import { ActionButton } from "@/components/admin/ActionButton";
import { NoticeForm } from "@/components/admin/NoticeForm";

export const revalidate = 0;

export default async function NoticesPage() {
  await ensureActiveUser(["ADMIN"]);
  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true, body: true, eventAt: true, expiresAt: true, createdAt: true },
  });
  const now = Date.now();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Notices</h1>
      <p className="mt-1 text-sm text-ink-muted">Shown on every student’s dashboard until they expire or you delete them.</p>

      <Card className="mt-6">
        <CardTitle>Post a notice</CardTitle>
        <div className="mt-4"><NoticeForm /></div>
      </Card>

      <Card className="mt-4">
        <CardTitle>Posted ({notices.length})</CardTitle>
        {notices.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nothing posted yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {notices.map((n) => {
              const over = (n.expiresAt ? n.expiresAt.getTime() : n.eventAt?.getTime() ?? Infinity) <= now;
              return (
                <li key={n.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{n.title}{over ? <span className="ml-2 text-xs text-ink-muted">(expired)</span> : null}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
                    {n.eventAt ? <p className="mt-0.5 text-xs text-ink-muted">Happens: {formatEvent(n.eventAt)}</p> : null}
                  </div>
                  <ActionButton url="/api/admin/notices" body={{ action: "delete", id: n.id }} label="Delete" busyLabel="Deleting…" />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
