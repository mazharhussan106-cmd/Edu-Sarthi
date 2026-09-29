// Owns the account page: who you are signed in as, and what this account has
// done.
//
// It deliberately shows different totals per role rather than hiding the ones
// that do not apply. A teacher's "audits written" and a student's "audits
// received" are different questions, and one number labelled for both would be
// wrong for at least one of them.
//
// Students can set their name here (email-code sign-in creates accounts with
// none) and use their data rights. Editing email is deliberately absent:
// changing it means re-verifying, a flow of its own.

import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { DataRights, NameForm } from "@/components/student/AccountActions";
import { displayId } from "@/lib/publicId";

export const revalidate = 0;

const ROLE_LABEL = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  ADMIN: "Administrator",
} as const;

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const isTeacher =
    session.user.role === "TEACHER" || session.user.role === "ADMIN";

  const [user, submissionCount, auditsWritten, auditsReceived] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          publicId: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      prisma.submission.count({ where: { studentId: userId } }),
      prisma.feedback.count({ where: { teacherId: userId } }),
      prisma.submission.count({ where: { studentId: userId, status: "REVIEWED" } }),
    ]);

  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Your account</h1>

      <Card className="mt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle>{user.name ?? "Unnamed"}</CardTitle>
            <p className="mt-1 truncate text-sm text-ink-muted">{user.email}</p>
            {user.phone ? (
              <p className="mt-0.5 text-sm text-ink-muted">{user.phone}</p>
            ) : null}
          </div>
          <Badge variant="accent">{ROLE_LABEL[user.role]}</Badge>
        </div>

        {!isTeacher ? (
          <div className="mt-5 border-t border-border pt-4">
            <NameForm initialName={user.name} />
            <p className="mt-3 text-xs text-ink-muted">
              Teachers see you only as{" "}
              <span className="font-mono text-ink">{displayId(user.publicId)}</span>, never
              by name.
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-xs text-ink-muted">
          <p>
            Email{" "}
            {user.emailVerified
              ? `verified on ${user.emailVerified.toLocaleDateString("en-IN")}`
              : "not verified yet"}
          </p>
          <p>Joined {user.createdAt.toLocaleDateString("en-IN")}</p>
          {/* Phone is collected unverified. Saying so is more honest than
              showing it next to the verified email and letting the user
              assume. */}
          {user.phone ? <p>Phone number is stored but not verified.</p> : null}
        </div>
      </Card>

      <Card className="mt-4">
        <CardTitle>{isTeacher ? "Your reviewing" : "Your practice"}</CardTitle>
        <div className="mt-4 flex gap-8">
          {isTeacher ? (
            <div>
              <p className="font-mono text-2xl font-bold text-ink">
                {auditsWritten}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-ink-muted">
                audits written
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="font-mono text-2xl font-bold text-ink">
                  {submissionCount}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-ink-muted">
                  submissions sent
                </p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-ink">
                  {auditsReceived}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-ink-muted">
                  audits received
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      <Link href="/settings" className="mt-4 block">
        <Card className="flex items-center justify-between p-4 transition-colors hover:bg-hover">
          <span>
            <span className="block font-display text-base font-bold text-ink">Settings</span>
            <span className="text-sm text-ink-muted">Theme, text size, notifications</span>
          </span>
          <span aria-hidden="true" className="text-ink-muted">›</span>
        </Card>
      </Link>

      <Card className="mt-4">
        <CardTitle>Password</CardTitle>
        <p className="mt-2 text-sm text-ink-muted">
          To change your password, sign out and use the reset link on the sign-in
          page. It arrives by email and works once.
        </p>
        <Link href="/forgot-password" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            Send myself a reset link
          </Button>
        </Link>
      </Card>

      {!isTeacher ? <DataRights /> : null}
    </main>
  );
}
