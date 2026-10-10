// Owns the Progress page: the longer view of the same numbers the dashboard
// shows in small — score trend, how each skill moved, the week's activity and
// where the flashcards stand — with every audit listed below.
//
// It deliberately has no export or PDF. "Reports" here means a page a student
// can read; a teacher-facing report would be a different feature.

import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/Card";
import { CardProgress } from "@/components/dashboard/CardProgress";
import { CriteriaChange } from "@/components/dashboard/CriteriaChange";
import { ScoreTrend, type TrendPoint } from "@/components/dashboard/ScoreTrend";
import { WeeklyActivity } from "@/components/dashboard/WeeklyActivity";
import { cardProgress, criteriaChange, weeklyActivity } from "@/lib/studentStats";

export const revalidate = 0;

export default async function ProgressPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [audits, activity, cards] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId: userId, status: "REVIEWED", feedback: { isNot: null } },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        exercise: { select: { title: true } },
        feedback: { select: { pronunciation: true, grammar: true, fluency: true, vocabulary: true, confidence: true } },
      },
    }),
    weeklyActivity(userId),
    cardProgress(userId),
  ]);

  const scored = audits.filter((a) => a.feedback);
  const trend: TrendPoint[] = scored.map((a) => {
    const f = a.feedback!;
    return {
      label: a.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      average: (f.pronunciation + f.grammar + f.fluency + f.vocabulary + f.confidence) / 5,
    };
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Progress</h1>
      <p className="mt-1 text-sm text-ink-muted">Everything here comes from your own audits and cards.</p>

      <Card className="mt-6">
        <CardTitle>Your average, audit by audit</CardTitle>
        <div className="mt-4"><ScoreTrend data={trend} /></div>
      </Card>
      <Card className="mt-4">
        <CardTitle>Rubric: first audit to latest</CardTitle>
        <div className="mt-3"><CriteriaChange rows={criteriaChange(scored.map((a) => a.feedback!))} /></div>
      </Card>
      <Card className="mt-4">
        <CardTitle>This week</CardTitle>
        <div className="mt-4"><WeeklyActivity days={activity} /></div>
      </Card>
      <Card className="mt-4">
        <CardTitle>Flashcards</CardTitle>
        <div className="mt-3"><CardProgress data={cards} /></div>
      </Card>

      <Card className="mt-4">
        <CardTitle>All audits</CardTitle>
        {scored.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No audits yet. Send a recording from <Link href="/modules" className="font-medium text-accent hover:underline">Practice</Link>.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {[...scored].reverse().map((a) => {
              const f = a.feedback!;
              const avg = (f.pronunciation + f.grammar + f.fluency + f.vocabulary + f.confidence) / 5;
              return (
                <li key={a.id}>
                  <Link href={`/feedback/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-hover">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">{a.exercise.title}</span>
                      <span className="text-xs text-ink-muted">{a.createdAt.toLocaleDateString("en-IN")}</span>
                    </span>
                    <span className="font-mono text-sm text-ink">{avg.toFixed(1)}/10</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
