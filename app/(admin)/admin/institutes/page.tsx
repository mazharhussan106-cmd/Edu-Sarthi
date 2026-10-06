// Owns the admin's institute list: applications waiting for a decision first,
// then running, rejected and suspended ones. Approve and reject sit on each
// application; a reason is required to reject or suspend and the institute's
// admin reads it.
//
// It deliberately shows the applicant's contact line as typed — that is what
// the admin needs to check the application is real — and nothing else about
// the applicant.

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ActionButton } from "@/components/admin/ActionButton";
import { ensureActiveUser } from "@/lib/activeUser";

export const revalidate = 0;

const STATUS_BADGE = { PENDING: "accent", APPROVED: "success", REJECTED: "error", SUSPENDED: "error" } as const;

export default async function AdminInstitutesPage() {
  // Re-checked in the page itself: a layout is not re-run on a client-side
  // navigation, and the role in the token can be older than a demotion.
  await ensureActiveUser(["ADMIN"]);
  const institutes = await prisma.institute.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 200,
    select: { id: true, name: true, description: true, contact: true, status: true, statusNote: true, createdAt: true, _count: { select: { members: true, decks: true } } },
  });
  const pending = institutes.filter((i) => i.status === "PENDING");
  const rest = institutes.filter((i) => i.status !== "PENDING");

  const row = (i: (typeof institutes)[number]) => (
    <li key={i.id}>
      <Card className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 max-w-xl">
          <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
            {i.name} <Badge variant={STATUS_BADGE[i.status]}>{i.status.toLowerCase()}</Badge>
          </p>
          <p className="mt-1 text-sm text-ink-muted">{i.description}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Contact: {i.contact} · Applied {i.createdAt.toLocaleDateString("en-IN")} · {i._count.members} members · {i._count.decks} decks
          </p>
          {i.statusNote ? <p className="mt-1 text-xs text-ink">Note: {i.statusNote}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {i.status === "PENDING" ? (
            <>
              <ActionButton url="/api/admin/institutes" body={{ action: "reject", id: i.id }} label="Reject" askReason />
              <ActionButton url="/api/admin/institutes" body={{ action: "approve", id: i.id }} label="Approve" variant="primary" />
            </>
          ) : null}
          {i.status === "APPROVED" ? <ActionButton url="/api/admin/institutes" body={{ action: "suspend", id: i.id }} label="Suspend" askReason /> : null}
          {i.status === "SUSPENDED" ? <ActionButton url="/api/admin/institutes" body={{ action: "reinstate", id: i.id }} label="Reinstate" variant="primary" /> : null}
        </div>
      </Card>
    </li>
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Institutes</h1>
      <p className="mt-1 text-sm text-ink-muted">Check the contact line is real before approving. An approved institute gets its own members and private decks.</p>
      <h2 className="mt-8 font-display text-base font-bold text-ink">Applications ({pending.length})</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {pending.length === 0 ? <li><Card className="text-sm text-ink-muted">No applications waiting.</Card></li> : pending.map(row)}
      </ul>
      <h2 className="mt-8 font-display text-base font-bold text-ink">All other institutes ({rest.length})</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {rest.length === 0 ? <li><Card className="text-sm text-ink-muted">None yet.</Card></li> : rest.map(row)}
      </ul>
    </main>
  );
}
