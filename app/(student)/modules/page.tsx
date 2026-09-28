// Owns the module list: the whole curriculum, with each module's progress for
// this student.
//
// It deliberately does not gate later modules behind earlier ones. A student
// who wants to attempt level 3 first is allowed to; the audit will tell them
// if it was too early, which is more useful than a locked padlock.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";

export const revalidate = 0;

export default async function ModulesPage() {
  const session = await auth();
  const studentId = session?.user?.id;

  const [modules, submissions] = await Promise.all([
    prisma.module.findMany({
      orderBy: { level: "asc" },
      select: {
        id: true,
        level: true,
        title: true,
        description: true,
        exercises: { select: { id: true } },
      },
    }),
    // Every exercise this student has submitted against, in one query. The
    // alternative is a count per module, which is a query per card.
    prisma.submission.findMany({
      where: { studentId },
      select: { exerciseId: true },
      distinct: ["exerciseId"],
    }),
  ]);

  const attempted = new Set(submissions.map((s) => s.exerciseId));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Modules</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Start anywhere. Each exercise is submitted and audited on its own.
      </p>

      {modules.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-ink-muted">
            No modules yet. Check back shortly.
          </p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {modules.map((m) => {
            const done = m.exercises.filter((e) => attempted.has(e.id)).length;
            const total = m.exercises.length;

            return (
              <Link key={m.id} href={`/modules/${m.id}`} className="block">
                <Card className="h-full transition-colors hover:bg-hover">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle>{m.title}</CardTitle>
                    <Badge variant={done === total && total > 0 ? "success" : "neutral"}>
                      {done}/{total}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{m.description}</p>
                  <p className="mt-3 text-xs text-mist">Level {m.level}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
