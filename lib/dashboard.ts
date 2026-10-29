// Owns every database read behind the student dashboard and turns it into
// plain data the page only lays out: today's XP, streak and week, the task
// list, "do this next", recordings with a teacher, audit scores, flashcard
// progress, stage and badges, and the getting-started steps.
//
// It deliberately reads in one parallel batch. The live pool has one
// connection, so these queue anyway, but nothing waits on a result it does
// not need. Every query is scoped to the one student.

import type { SubmissionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";
import { auditAllowance } from "@/lib/auditLimit";
import { todayReview } from "@/lib/todayReview";
import { activeNotices } from "@/lib/notices";
import { cardProgress, knownByKind, CRITERIA, type CriterionKey } from "@/lib/studentStats";
import { xpDays, xpMap } from "@/lib/xp";
import { settleFreezes } from "@/lib/freeze";
import { addDays, bestDay, istDay, learningDays, longestStreak, monthOf, stageOf, streakAtRisk, streakOf, weekOf, weekXp } from "@/lib/streak";
import { badgesFor, nextBadge } from "@/lib/badges";
import { nextAction } from "@/lib/dashboardNext";
import { summaryLine, todayTasks } from "@/lib/dashboardTasks";
import { SLA_HOURS } from "@/lib/claims";

const SCORES = { pronunciation: true, grammar: true, fluency: true, vocabulary: true, confidence: true } as const;
type Scores = Record<CriterionKey, number>;

/// A card recording is named by its card; an exercise by its title.
const titleOf = (s: { exercise: { title: string }; word: { text: string } | null }) => (s.word ? `Card: ${s.word.text}` : s.exercise.title);
const avg = (f: Scores) => CRITERIA.reduce((n, c) => n + f[c.key], 0) / CRITERIA.length;

export type Step = { label: string; sub?: string; href?: string; done: boolean; xp?: number };

export async function dashboardData(userId: string, isGuest: boolean, now = new Date()) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, preferences: true } });
  const prefs = prefsOf(me?.preferences);
  const reviewed = { studentId: userId, status: "REVIEWED" as SubmissionStatus, feedback: { isNot: null } };
  const auditSelect = { id: true, createdAt: true, exercise: { select: { title: true } }, word: { select: { text: true } }, feedback: { select: { ...SCORES, summary: true } } } as const;

  const [xp, review, allowance, inFlight, recent, first, auditCount, nextExercise, notices, cards, kinds, decksOwned] = await Promise.all([
    xpDays(userId),
    todayReview(userId, prefs.newPerDay),
    isGuest ? null : auditAllowance(userId),
    prisma.submission.findMany({
      // A sent-back attempt that has been replaced is finished business; the
      // replacement is what is with a teacher now.
      where: { studentId: userId, OR: [{ status: { in: ["PENDING", "IN_REVIEW"] } }, { status: "RETURNED", retry: { is: null } }] },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id: true, status: true, createdAt: true, exercise: { select: { title: true } }, word: { select: { text: true } } },
    }),
    // Newest 50: enough for a steady average, and the chart shows the last 20.
    prisma.submission.findMany({ where: reviewed, orderBy: { createdAt: "desc" }, take: 50, select: auditSelect }),
    prisma.submission.findFirst({ where: reviewed, orderBy: { createdAt: "asc" }, select: { feedback: { select: SCORES } } }),
    prisma.submission.count({ where: reviewed }),
    isGuest
      ? null
      : prisma.exercise.findFirst({
          where: { submissions: { none: { studentId: userId } }, module: { isSystem: false } },
          orderBy: [{ module: { level: "asc" } }, { title: "asc" }],
          select: { id: true, title: true, module: { select: { level: true } } },
        }),
    activeNotices(3),
    cardProgress(userId),
    knownByKind(userId),
    prisma.deck.count({ where: { ownerId: userId } }),
  ]);

  // Day and streak numbers.
  const today = istDay(now);
  const byDay = xpMap(xp.days);
  const todayXp = byDay.get(today) ?? 0;
  const goal = prefs.dailyGoalXp;
  // Settled before the streak is counted: a freeze can keep it alive.
  const freezes = await settleFreezes(userId, byDay, today, goal, prefs.weeklyGoalDays);
  const streak = streakOf(byDay, today, freezes.frozen);
  const days = learningDays(byDay);
  const week = weekOf(byDay, today, goal, freezes.frozen);
  const longest = longestStreak(byDay, freezes.frozen);
  const recordings = [...xp.days.values()].reduce((n, d) => n + d.recordings, 0);

  // Work for today.
  const redo = inFlight.filter((s) => s.status === "RETURNED").map((s) => ({ id: s.id, title: titleOf(s) }));
  const recordingHref = nextExercise ? `/practice/${nextExercise.id}` : "/modules";
  const tasks = todayTasks({
    redo,
    kinds: review.kinds,
    decks: review.decks,
    reviewsToday: xp.days.get(today)?.reviews ?? 0,
    audits: allowance,
    recordingHref,
  });
  const next = nextAction({
    redo,
    kinds: review.kinds,
    decks: review.decks,
    firstDay: cards.seen === 0 && recordings === 0,
    member: !isGuest,
    nextExercise,
  });

  // Audits, oldest first for the chart.
  const audits = recent.filter((s) => s.feedback).reverse();
  const latest = audits.at(-1) ?? null;
  const before = audits.at(-2) ?? null;
  const firstScores = first?.feedback ?? null;
  const skills = latest
    ? CRITERIA.map((c) => ({
        label: c.label,
        mean: audits.reduce((n, s) => n + s.feedback![c.key], 0) / audits.length,
        change: latest.feedback![c.key] - (firstScores ? firstScores[c.key] : latest.feedback![c.key]),
      }))
    : [];
  const trend = audits.slice(-20).map((s) => ({
    label: s.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
    average: avg(s.feedback!),
  }));

  // Stage and badges.
  const badges = badgesFor({
    submissions: recordings,
    audits: auditCount,
    streak,
    longestStreak: longest,
    cardsKnown: cards.known,
    decks: decksOwned,
    bestDayXp: bestDay(byDay),
    weeksMet: freezes.weeksMet,
  });

  // Getting started, until three learning days or every step is done.
  const steps: Step[] = [
    { label: "Set your level and goal", sub: "On your profile, for you alone", href: "/profile", done: prefs.level !== "unset" || prefs.goal !== "unset" },
    { label: "Learn your first 10 cards", sub: "About 5 minutes", href: "/flashcards?kind=words", done: cards.seen >= 10, xp: 20 },
    ...(isGuest
      ? [{ label: "Keep your progress", sub: "Add your email; recordings and audits come with it", href: "/settings", done: false }]
      : [
          { label: "Send your first recording", sub: "Say a short self-introduction", href: recordingHref, done: recordings > 0, xp: 10 },
          { label: "Get your first audit back", sub: `Teachers aim to reply within ${SLA_HOURS} hours`, done: auditCount > 0 },
        ]),
  ];

  return {
    firstName: me?.name?.trim().split(" ")[0] ?? null,
    isGuest,
    summary: summaryLine(tasks, todayXp, goal),
    today: {
      day: today,
      xp: todayXp,
      goal,
      streak,
      atRisk: streakAtRisk(now, todayXp, streak),
      week: week.dots,
      weekMet: week.met,
      weeklyGoal: prefs.weeklyGoalDays,
      freezes: freezes.held,
      savedYesterday: freezes.frozen.has(addDays(today, -1)),
    },
    totalXp: xp.total,
    // For the streak and XP sheets the dashboard's pills open.
    sheets: {
      longest,
      bestDay: bestDay(byDay),
      weekXp: weekXp(byDay, today),
      month: monthOf(byDay, today, goal, freezes.frozen),
      freezes: freezes.held,
    },
    stage: stageOf(xp.total),
    next,
    tasks,
    inFlight: inFlight.map((s) => ({ id: s.id, status: s.status, createdAt: s.createdAt, title: titleOf(s) })),
    latest: latest
      ? { id: latest.id, createdAt: latest.createdAt, title: titleOf(latest), scores: latest.feedback! as Scores, summary: latest.feedback!.summary, average: avg(latest.feedback!), previous: before ? avg(before.feedback!) : null }
      : null,
    auditCount,
    skills,
    trend,
    notices,
    cards,
    kinds,
    badges,
    nextBadge: nextBadge(badges),
    gettingStarted: days < 3 && steps.some((s) => !s.done) ? steps : null,
    welcome: cards.seen === 0 && recordings === 0,
  };
}

export type DashboardData = Awaited<ReturnType<typeof dashboardData>>;
