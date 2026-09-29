// Owns the account page: who you are signed in as, and what this account has
// done.
//
// It deliberately shows different totals per role rather than hiding the ones
// that do not apply. A teacher's "audits written" and a student's "audits
// received" are different questions, and one number labelled for both would be
// wrong for at least one of them.
//
// Editing name and email is deliberately absent. Changing an email means
// re-verifying it, which is a flow of its own, and a form that silently does
// not re-verify is worse than no form.

import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";

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
    <main className="mx-auto max-w-4xl px-6 py-10">
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
    </main>
  );
}
