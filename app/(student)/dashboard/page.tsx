// Owns the student's home screen, laid out in the order agreed with the owner
// on 29 Oct 2026 (docs/DASHBOARD-PLAN.md): today first — the goal ring and
// streak, one thing to do next, today's tasks — then what came back from a
// teacher, notices, and only then progress (skills, the score trend,
// flashcards, stage and badges).
//
// It deliberately does no database work itself; lib/dashboard reads
// everything and this file only places it. On a computer the Today card,
// stage and notices move to a right-hand column, so those three are drawn in
// both places and hidden in one by breakpoint: a grid cannot reorder blocks
// of different heights into two independent columns.

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { dashboardData } from "@/lib/dashboard";
import { Card, CardTitle } from "@/components/ui/Card";
import { ScoreTrend } from "@/components/dashboard/ScoreTrend";
import { NoticesCard } from "@/components/dashboard/NoticesCard";
import { StatPills } from "@/components/dashboard/StatPills";
import { TodayCard } from "@/components/dashboard/TodayCard";
import { NextCard } from "@/components/dashboard/NextCard";
import { TodayTasks } from "@/components/dashboard/TodayTasks";
import { TeacherCard } from "@/components/dashboard/TeacherCard";
import { SkillsCard } from "@/components/dashboard/SkillsCard";
import { KindsCard } from "@/components/dashboard/KindsCard";
import { StageCard } from "@/components/dashboard/StageCard";
import { GettingStarted } from "@/components/dashboard/GettingStarted";
import { StreakSheet } from "@/components/dashboard/StreakSheet";
import { XpSheet } from "@/components/dashboard/XpSheet";

// Anything reflecting user state must not be cached, or one student's view is
// served to everyone until it expires.
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const d = await dashboardData(userId, !!session.user.isGuest);
  const member = !d.isGuest;

  const today = <TodayCard t={d.today} />;
  const stage = <StageCard xp={d.totalXp} stage={d.stage} badges={d.badges} next={d.nextBadge} />;
  const notices = <NoticesCard notices={d.notices} />;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-ink">
            {d.welcome ? "Welcome" : "Hello"}{d.firstName ? `, ${d.firstName}` : ""}
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">{d.summary}</p>
        </div>
        <StatPills
          streak={d.today.streak}
          xp={d.totalXp}
          stage={d.stage.stage}
          streakSheet={<StreakSheet streak={d.today.streak} longest={d.sheets.longest} goal={d.today.goal} weekMet={d.today.weekMet} weeklyGoal={d.today.weeklyGoal} month={d.sheets.month} />}
          xpSheet={<XpSheet total={d.totalXp} today={d.today.xp} week={d.sheets.weekXp} best={d.sheets.bestDay} goal={d.today.goal} stage={d.stage} />}
        />
      </header>

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-5">
        <div className="flex flex-col gap-4">
          <div className="lg:hidden">{today}</div>
          <NextCard next={d.next} />
          {d.gettingStarted ? <GettingStarted steps={d.gettingStarted} /> : null}
          <TodayTasks rows={d.tasks} />
          <TeacherCard items={d.inFlight} latest={d.latest} />
          {d.notices.length > 0 ? <div className="lg:hidden">{notices}</div> : null}
          {d.gettingStarted ? null : (
            <>
              <SkillsCard rows={d.skills} audits={d.auditCount} member={member} />
              {d.trend.length >= 2 ? (
                <Card className="p-4 sm:p-5">
                  <CardTitle>Your average, audit by audit</CardTitle>
                  <div className="mt-3">
                    <ScoreTrend data={d.trend} />
                  </div>
                </Card>
              ) : null}
              <KindsCard data={d.cards} kinds={d.kinds} />
              <div className="lg:hidden">{stage}</div>
            </>
          )}
        </div>

        <aside className="hidden flex-col gap-4 lg:flex" aria-label="Today, stage and notices">
          {today}
          {d.gettingStarted ? null : stage}
          {notices}
        </aside>
      </div>
    </main>
  );
}
