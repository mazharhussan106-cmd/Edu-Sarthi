// Owns the list of every audit this student has received.
//
// It deliberately shows only REVIEWED submissions. Pending and in-review items
// live on the module pages, where the student can see what they are waiting
// for next to what they submitted.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/Card";

export const revalidate = 0;

function average(f: {
  pronunciation: number;
  grammar: number;
  fluency: number;
  vocabulary: number;
  confidence: number;
}): string {
  const total =
    f.pronunciation + f.grammar + f.fluency + f.vocabulary + f.confidence;
  return (total / 5).toFixed(1);
}

export default async function FeedbackListPage() {
  const session = await auth();
  const studentId = session?.user?.id;

  const submissions = await prisma.submission.findMany({
    where: { studentId, status: "REVIEWED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      exercise: { select: { title: true } },
      feedback: {
        select: {
          pronunciation: true,
          grammar: true,
          fluency: true,
          vocabulary: true,
          confidence: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Your audits</h1>

      {submissions.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-ink-muted">
            No audits yet. Submit an exercise and one will appear here once a
            teacher has reviewed it.
          </p>
          <Link
            href="/modules"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Browse modules
          </Link>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {submissions.map((s) => (
            <Link key={s.id} href={`/feedback/${s.id}`} className="block">
              <Card className="flex items-center justify-between gap-4 transition-colors hover:bg-hover">
                <div className="min-w-0">
                  <CardTitle>{s.exercise.title}</CardTitle>
                  <p className="mt-1 text-xs text-ink-muted">
                    {s.createdAt.toLocaleDateString("en-IN")}
                  </p>
                </div>
                {s.feedback ? (
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-lg font-bold text-ink">
                      {average(s.feedback)}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-ink-muted">
                      average
                    </p>
                  </div>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
