// Owns the user directory (spec A-04): every account with its role, status and
// activity, filterable by type and searchable, with role changes and
// suspension. Recent activity opens inline per row.
//
// Admins see real emails here — that is the point of this page, and it is
// behind the admin role. Teachers never do; their screens use student IDs.

import Link from "next/link";
import type { Prisma, Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_BADGE } from "@/lib/audits";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ActionButton } from "@/components/admin/ActionButton";
import { RoleForm } from "@/components/admin/RoleForm";
import { cn } from "@/lib/utils";
import { ensureActiveUser } from "@/lib/activeUser";

export const revalidate = 0;

const PAGE = 25;
const TYPES = [
  { value: "all", label: "All", roles: null },
  { value: "students", label: "Students", roles: ["STUDENT"] },
  { value: "teachers", label: "Teachers", roles: ["TEACHER"] },
  { value: "admins", label: "Admins", roles: ["ADMIN"] },
  { value: "suspended", label: "Suspended", roles: null },
] as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; page?: string }>;
}) {
  // Re-checked in the page itself: a layout is not re-run on a client-side
  // navigation, and the role in the token can be older than a demotion.
  await ensureActiveUser(["ADMIN"]);
  const sp = await searchParams;
  const type = TYPES.find((t) => t.value === sp.type) ?? TYPES[0];
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const session = await auth();
  const me = session?.user?.id;

  const where: Prisma.UserWhereInput = {
    ...(type.roles ? { role: { in: [...type.roles] as Role[] } } : {}),
    ...(type.value === "suspended" ? { suspendedAt: { not: null } } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { publicId: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: {
        id: true,
        publicId: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        suspendedAt: true,
        suspendReason: true,
        teacherVerifiedAt: true,
        createdAt: true,
        _count: { select: { submissions: true, reviewsGiven: true } },
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, status: true, createdAt: true, exercise: { select: { title: true } } },
        },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: { type?: string; page?: number }) =>
    `/admin/users?${new URLSearchParams({ type: p.type ?? type.value, ...(q ? { q } : {}), page: String(p.page ?? 1) })}`;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Users</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {total} account{total === 1 ? "" : "s"}. A role change applies the next time that person signs in;
        a suspension applies on their next page load.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <nav aria-label="User type" className="flex gap-1">
          {TYPES.map((t) => (
            <Link
              key={t.value}
              href={link({ type: t.value })}
              aria-current={type.value === t.value ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm",
                type.value === t.value ? "border-accent font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/users" className="mb-2">
          <input type="hidden" name="type" value={type.value} />
          <label htmlFor="users-q" className="sr-only">Search users</label>
          <input
            id="users-q"
            name="q"
            defaultValue={q}
            placeholder="Email, name or student ID"
            className="h-8 w-64 rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink placeholder:text-ink-muted"
          />
        </form>
      </div>

      {users.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-ink-muted">No accounts match.</p>
        </Card>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-ink-muted">
                <th className="px-3 py-3 font-medium">Account</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-3 py-3 font-medium">Usage</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const self = u.id === me;
                return (
                  <tr key={u.id} className={cn("align-top", u.suspendedAt && "bg-error/5")}>
                    <td className="px-3 py-2.5">
                      <p className="text-ink">{u.name ?? "—"}</p>
                      <p className="text-xs text-ink-muted">{u.email}</p>
                      {u.role === "STUDENT" && u.publicId ? <p className="font-mono text-[11px] text-ink-muted">{u.publicId}</p> : null}
                      {u.submissions.length > 0 ? (
                        <details className="mt-1 text-xs">
                          <summary className="cursor-pointer text-accent">Recent activity</summary>
                          <ul className="mt-1 flex flex-col gap-0.5 text-ink-muted">
                            {u.submissions.map((s) => (
                              <li key={s.id}>
                                {s.createdAt.toLocaleDateString("en-IN")} · {s.exercise.title} · {STATUS_BADGE[s.status].text}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      {u.suspendedAt ? (
                        <>
                          <Badge variant="error">Suspended</Badge>
                          <p className="mt-1 max-w-48 text-xs text-ink-muted">{u.suspendReason}</p>
                        </>
                      ) : u.emailVerified ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge>Unverified</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-ink-muted">{u.createdAt.toLocaleDateString("en-IN")}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">
                      {u.role === "STUDENT" ? `${u._count.submissions} sent` : `${u._count.reviewsGiven} audits`}
                    </td>
                    <td className="px-3 py-2.5">
                      {self ? (
                        <Badge variant="accent">You · {u.role.toLowerCase()}</Badge>
                      ) : (
                        <span className="flex flex-col items-start gap-1.5">
                          <RoleForm userId={u.id} role={u.role} />
                          {u.role === "TEACHER" ? (
                            u.teacherVerifiedAt ? (
                              <span className="flex items-center gap-1.5">
                                <Badge variant="success">Verified teacher</Badge>
                                <ActionButton url="/api/admin/users" body={{ action: "verifyTeacher", userId: u.id, on: false }} label="Remove" variant="ghost" askReason />
                              </span>
                            ) : (
                              <ActionButton url="/api/admin/users" body={{ action: "verifyTeacher", userId: u.id, on: true }} label="Verify teacher" askReason />
                            )
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end">
                        {self ? null : u.suspendedAt ? (
                          <ActionButton url="/api/admin/users" body={{ action: "unsuspend", userId: u.id }} label="Lift suspension" askReason />
                        ) : (
                          <ActionButton
                            url="/api/admin/users"
                            body={{ action: "suspend", userId: u.id }}
                            label="Suspend"
                            variant="ghost"
                            confirmWord="CONFIRM"
                            askReason
                          />
                        )}
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
          <span>Page {page} of {pages} · {total} total</span>
          {page < pages ? <Link href={link({ page: page + 1 })} className="rounded-md border border-border-strong px-2 py-1 hover:bg-hover">Next</Link> : null}
        </nav>
      ) : null}
    </main>
  );
}
