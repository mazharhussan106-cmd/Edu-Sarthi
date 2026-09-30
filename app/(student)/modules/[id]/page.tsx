// Owns one module's exercise list, with this student's status on each.
//
// Status comes from the student's most recent submission per exercise, not
// from a stored progress field — derived state that can drift out of sync with
// the submissions it describes is worse than one more query.

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";

export const revalidate = 0;

const STATUS_LABEL = {
  PENDING: { text: "Waiting for a teacher", variant: "neutral" },
  IN_REVIEW: { text: "Being reviewed", variant: "accent" },
  REVIEWED: { text: "Audit ready", variant: "success" },
  RETURNED: { text: "Sent back — try again", variant: "error" },
} as const;

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const studentId = session?.user?.id;

  const [module, submissions] = await Promise.all([
    prisma.module.findUnique({
      where: { id },
      select: {
        id: true,
        level: true,
        title: true,
        description: true,
        exercises: {
          orderBy: { title: "asc" },
          select: {
            id: true,
            title: true,
            prompt: true,
            expects: true,
            minSeconds: true,
            maxSeconds: true,
          },
        },
      },
    }),
    // Scoped by studentId in the WHERE clause, not fetched and compared.
    prisma.submission.findMany({
      where: { studentId, exercise: { moduleId: id } },
      orderBy: { createdAt: "desc" },
      select: { id: true, exerciseId: true, status: true },
    }),
  ]);

  if (!module) notFound();

  // First match wins because the list is newest-first.
  const latest = new Map<string, (typeof submissions)[number]>();
  for (const s of submissions) if (!latest.has(s.exerciseId)) latest.set(s.exerciseId, s);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/modules" className="text-xs text-ink-muted hover:text-accent">
        ← All modules
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-ink">
        {module.title}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">{module.description}</p>

      <div className="mt-6 flex flex-col gap-3">
        {module.exercises.map((e) => {
          const current = latest.get(e.id);
          const status = current ? STATUS_LABEL[current.status] : null;

          return (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle>{e.title}</CardTitle>
                  <p className="mt-1 text-sm text-ink-muted">{e.prompt}</p>
                  <p className="mt-2 text-xs text-mist">
                    {e.expects.toLowerCase()}
                    {e.minSeconds && e.maxSeconds
                      ? ` · ${e.minSeconds}–${e.maxSeconds} seconds`
                      : ""}
                  </p>
                </div>
                {status ? (
                  <Badge variant={status.variant}>{status.text}</Badge>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2">
                <Link href={`/practice/${e.id}`}>
                  <Button size="sm" variant={current ? "outline" : "primary"}>
                    {current ? "Submit again" : "Start"}
                  </Button>
                </Link>
                {current?.status === "REVIEWED" ? (
                  <Link href={`/feedback/${current.id}`}>
                    <Button size="sm" variant="ghost">
                      Read the audit
                    </Button>
                  </Link>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
