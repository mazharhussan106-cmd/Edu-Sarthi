// Owns the student's home screen: what is waiting, what came back, and whether
// the scores are moving.
//
// It opens with one "do this next" card and the habit numbers (streak, today's
// goal), then in-flight submissions, then the score trend.
//
// It deliberately puts in-flight submissions above the score trend. The first question a student opens this page with is "has my teacher
// looked at it yet", not "what is my average".
//
// It deliberately computes the weakest criterion in application code rather
// than in SQL. Five AVG() columns over at most a few dozen rows is not worth a
// raw query, and this stays readable.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/Card";
import { ScoreTrend, type TrendPoint } from "@/components/dashboard/ScoreTrend";
import { DAILY_GOAL, sentToday, streakDays } from "@/lib/progress";
import { TodayStrip } from "@/components/student/TodayStrip";
import { deckCounts } from "@/lib/flashcards";
import { nextAction } from "@/lib/dashboardNext";
import { newPerDayOf } from "@/lib/preferences";
import { cardProgress, criteriaChange, weeklyActivity } from "@/lib/studentStats";
import { InFlightCard } from "@/components/dashboard/InFlightCard";
import { LatestAudit } from "@/components/dashboard/LatestAudit";
import { WhatToWorkOn } from "@/components/dashboard/WhatToWorkOn";
import { CardProgress } from "@/components/dashboard/CardProgress";
import { CriteriaChange } from "@/components/dashboard/CriteriaChange";
import { TodayWork } from "@/components/dashboard/TodayWork";
import { WeeklyActivity } from "@/components/dashboard/WeeklyActivity";

// Anything reflecting user state must not be cached, or one student's view is
// served to everyone until it expires.
export const revalidate = 0;

const CRITERIA = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "grammar", label: "Grammar" },
  { key: "fluency", label: "Fluency" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "confidence", label: "Confidence" },
] as const;

export default async function DashboardPage() {
  const session = await auth();
  const studentId = session?.user?.id;
  // Read from the row, not the JWT: a name set on the profile page after
  // sign-in is not in the token until the next sign-in.
  const me = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } });
  const firstName = me?.name?.split(" ")[0] ?? "there";

  const since = new Date(Date.now() - 400 * 86_400_000);
  const [inFlight, reviewed, moduleCount, recent, toRedo, nextExercise] = await Promise.all([
    prisma.submission.findMany({
      // A sent-back attempt that has been replaced is finished business; the
      // replacement is what is with a teacher now.
      where: {
        studentId,
        OR: [
          { status: { in: ["PENDING", "IN_REVIEW"] } },
          { status: "RETURNED", retry: { is: null } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        exercise: { select: { id: true, title: true } },
      },
    }),
    // Oldest first so the chart reads left to right in time order. Capped at
    // 20: a trend line is about direction, and forty points on a phone is a
    // smear.
    prisma.submission.findMany({
      where: { studentId, status: "REVIEWED" },
      orderBy: { createdAt: "asc" },
      take: 20,
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
            summary: true,
          },
        },
      },
    }),
    prisma.module.count({ where: { isSystem: false } }),
    // Dates only, for the streak. A year is longer than any streak worth
    // showing, and bounds the query for a student who has sent thousands.
    prisma.submission.findMany({
      where: { studentId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    // Sent back and not yet replaced: the one thing on this page the student
    // must act on, so it outranks every other suggestion.
    prisma.submission.findFirst({
      where: { studentId, status: "RETURNED", retry: { is: null } },
      orderBy: { createdAt: "asc" },
      select: { id: true, exercise: { select: { title: true } } },
    }),
    // The first exercise, in curriculum order, this student has never tried.
    prisma.exercise.findFirst({
      where: { submissions: { none: { studentId } }, module: { isSystem: false } },
      orderBy: [{ module: { level: "asc" } }, { title: "asc" }],
      select: { id: true, title: true, module: { select: { level: true } } },
    }),
  ]);

  const prefRow = await prisma.user.findUnique({ where: { id: studentId! }, select: { preferences: true } });
  const cards = await deckCounts(studentId!, { kind: "WORD" }, newPerDayOf(prefRow?.preferences));

  // Independent of everything above, so they run together.
  const [activity, cardStats] = await Promise.all([weeklyActivity(studentId!), cardProgress(studentId!)]);

  const dates = recent.map((r) => r.createdAt);
  const streak = streakDays(dates);
  const today = Math.min(sentToday(dates), DAILY_GOAL);
  const next = nextAction({ toRedo, cards, nextExercise });

  const scored = reviewed.filter((s) => s.feedback !== null);

  const trend: TrendPoint[] = scored.map((s) => {
    const f = s.feedback!;
    const total =
      f.pronunciation + f.grammar + f.fluency + f.vocabulary + f.confidence;
    return {
      label: s.createdAt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      average: total / 5,
    };
  });

  // The weakest criterion across every audit, which is the single most useful
  // sentence this page can give a student.
  const weakest =
    scored.length > 0
      ? CRITERIA.map((c) => ({
          label: c.label,
          mean:
            scored.reduce((sum, s) => sum + s.feedback![c.key], 0) / scored.length,
        })).sort((a, b) => a.mean - b.mean)[0]
      : null;

  const latest = scored.length > 0 ? scored[scored.length - 1] : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">
        Hello, {firstName}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {inFlight.length > 0
          ? `${inFlight.length} submission${inFlight.length === 1 ? "" : "s"} with a teacher right now.`
          : scored.length > 0
            ? "Nothing waiting. Send another when you are ready."
            : `${moduleCount} module${moduleCount === 1 ? "" : "s"} to work through. Start anywhere.`}
      </p>

      <TodayStrip next={next} streak={streak} today={today} goal={DAILY_GOAL} />
      <TodayWork
        due={cards.due}
        newLeft={cards.newLeft}
        redo={inFlight.filter((s) => s.status === "RETURNED").length}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <InFlightCard items={inFlight} />

          <Card>
            <CardTitle>Your average, audit by audit</CardTitle>
            <div className="mt-4">
              <ScoreTrend data={trend} />
            </div>
          </Card>

          <Card>
            <CardTitle>This week</CardTitle>
            <div className="mt-4">
              <WeeklyActivity days={activity} />
            </div>
          </Card>

          <Card>
            <CardTitle>Rubric: first audit to latest</CardTitle>
            <div className="mt-3">
              <CriteriaChange rows={criteriaChange(scored.map((s) => s.feedback!))} />
            </div>
          </Card>

          {latest ? <LatestAudit latest={{ ...latest, feedback: latest.feedback! }} /> : null}
        </div>

        <aside className="flex flex-col gap-4">
          <WhatToWorkOn weakest={weakest} />

          <Card>
            <CardTitle>Flashcards</CardTitle>
            <div className="mt-3">
              <CardProgress data={cardStats} />
            </div>
          </Card>

          <Card>
            <CardTitle>Audits received</CardTitle>
            <p className="mt-2 font-mono text-3xl font-bold text-ink">
              {scored.length}
            </p>
            <Link
              href="/feedback"
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              See all of them
            </Link>
          </Card>
        </aside>
      </div>
    </main>
  );
}
