// Owns the Institute page — one page that is whatever the viewer's situation
// needs: join or apply (no institute), the application's status (pending,
// rejected, suspended), or the institute itself (members, join code and shared
// decks).
//
// Membership is read from the session's own account only. Members' names and
// emails are shown to the institute's admin alone. It deliberately does NOT
// show institute decks outside the institute, or in the public library.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { myMembership } from "@/lib/institutes";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ApplyForm, JoinForm, LeaveButton } from "@/components/institute/InstituteForms";
import { JoinCodeBox, MemberControls } from "@/components/institute/MemberControls";

export const revalidate = 0;

const ROLE_LABEL = { ADMIN: "Admin", TEACHER: "Teacher", STUDENT: "Student" } as const;

export default async function InstitutePage() {
  const userId = (await auth())!.user.id;
  const m = await myMembership(userId);

  if (!m) {
    return (
      <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
        <h1 className="font-display text-xl font-bold text-ink">Institute</h1>
        <p className="mt-1 text-sm text-ink-muted">An institute is a school or coaching centre with its own teachers, students and private decks.</p>
        <Card className="mt-4"><h2 className="font-display text-base font-bold text-ink">Join one</h2><div className="mt-3"><JoinForm /></div></Card>
        <Card className="mt-4">
          <h2 className="font-display text-base font-bold text-ink">Run an institute?</h2>
          <p className="mt-1 text-sm text-ink-muted">Apply and the EduSarthi admin will check and approve it. You become its admin; students join with a code you give them.</p>
          <div className="mt-3"><ApplyForm /></div>
        </Card>
      </main>
    );
  }

  const inst = m.institute;
  if (inst.status !== "APPROVED") {
    const variant = inst.status === "PENDING" ? "accent" : "error";
    return (
      <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
        <h1 className="font-display text-xl font-bold text-ink">{inst.name}</h1>
        <Card className="mt-4">
          <Badge variant={variant}>{inst.status === "PENDING" ? "Waiting for approval" : inst.status === "REJECTED" ? "Not approved" : "Suspended"}</Badge>
          <p className="mt-3 text-sm text-ink">
            {inst.status === "PENDING"
              ? "Your application has been sent. An EduSarthi admin will check the contact details you gave and approve it. Nothing else is needed from you."
              : inst.status === "REJECTED"
                ? "This application was not approved."
                : "This institute is suspended, so its decks and members are paused."}
          </p>
          {inst.statusNote ? <p className="mt-2 rounded-lg bg-paper-dim p-2 text-sm text-ink"><b>Admin’s note:</b> {inst.statusNote}</p> : null}
          {inst.status === "REJECTED" && m.role === "ADMIN" ? (
            <div className="mt-4"><p className="mb-2 text-sm text-ink-muted">Fix what the note says, then apply again.</p><ApplyForm label="Apply again" /></div>
          ) : null}
          {inst.status === "SUSPENDED" && m.role !== "ADMIN" ? <div className="mt-4"><LeaveButton /></div> : null}
        </Card>
      </main>
    );
  }

  const isAdmin = m.role === "ADMIN";
  const [decks, members] = await Promise.all([
    prisma.deck.findMany({
      where: { instituteId: inst.id, visibility: "INSTITUTE" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, description: true, _count: { select: { cards: true } } },
    }),
    isAdmin
      ? prisma.instituteMember.findMany({ where: { instituteId: inst.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }], select: { userId: true, role: true, user: { select: { name: true, email: true } } } })
      : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-ink">{inst.name}</h1>
        <Badge variant="success">{ROLE_LABEL[m.role]}</Badge>
      </div>

      <h2 className="mt-5 font-display text-base font-bold text-ink">Institute decks</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {decks.length === 0 ? (
          <li><Card className="text-sm text-ink-muted">No decks yet. {m.role === "STUDENT" ? "Your teachers will share some here." : "Open one of your decks in My decks and choose “Share with my institute”."}</Card></li>
        ) : null}
        {decks.map((d) => (
          <li key={d.id}>
            <Link href={`/institute/decks/${d.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 hover:bg-hover">
                <span className="min-w-0">
                  <span className="block truncate font-display font-bold text-ink">{d.title}</span>
                  {d.description ? <span className="block truncate text-xs text-ink-muted">{d.description}</span> : null}
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-muted">{d._count.cards} cards</span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {isAdmin ? (
        <>
          <Card className="mt-6"><JoinCodeBox code={inst.joinCode} /></Card>
          <h2 className="mt-6 font-display text-base font-bold text-ink">Members ({members.length})</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {members.map((x) => (
              <li key={x.userId}>
                <Card className="flex items-center justify-between gap-3 p-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{x.user.name ?? x.user.email ?? "Member"}</span>
                    <span className="block truncate text-xs text-ink-muted">{x.user.name ? x.user.email : ""}</span>
                  </span>
                  {x.role === "ADMIN" ? <Badge variant="accent">Admin</Badge> : <MemberControls userId={x.userId} role={x.role} />}
                </Card>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-6"><LeaveButton /></div>
      )}
    </main>
  );
}
