// Owns the numbers on the student's Profile: who they are, their XP per day,
// streak (with freezes), today's and this week's goal, cards known, audits,
// decks and speaking scores, gathered in one round of parallel queries.
//
// The streak, XP, badges and skill numbers follow the dashboard's rules
// exactly (lib/streak, lib/xp, lib/freeze, lib/dashboard), so the two pages
// can never disagree. Every query is scoped to the one user. Cards count only
// built-in ones (deckId null), like the daily session.
//
// It deliberately does NOT draw anything or decide wording; components/profile
// does. Teacher and admin numbers live in lib/staffProfileStats.

import { avatarUrl } from "@/lib/avatar";
import { settleFreezes } from "@/lib/freeze";
import { prisma } from "@/lib/prisma";
import { prefsOf, type Preferences } from "@/lib/preferences";
import { bestDay, istDay, longestStreak, streakOf, weekOf } from "@/lib/streak";
import { CRITERIA } from "@/lib/studentStats";
import { xpDays, xpMap, type DayXp } from "@/lib/xp";

const SCORES = { pronunciation: true, grammar: true, fluency: true, vocabulary: true, confidence: true } as const;

/// One skill on the Speaking scores card, the same numbers as the dashboard's
/// "Your skills": the average over the newest 50 audits, and the change from
/// the first audit to the latest (null until there are two).
export type SkillScore = { key: string; label: string; now: number; change: number | null };

export function skillScores(newestFirst: readonly Record<string, number>[], first: Record<string, number> | null): SkillScore[] {
  if (newestFirst.length === 0) return [];
  const round = (n: number) => Math.round(n * 10) / 10;
  return CRITERIA.map((c) => ({
    key: c.key,
    label: c.label,
    now: round(newestFirst.reduce((sum, a) => sum + a[c.key], 0) / newestFirst.length),
    change: newestFirst.length > 1 && first ? newestFirst[0][c.key] - first[c.key] : null,
  }));
}

export type StudentProfile = {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    publicId: string | null;
    isGuest: boolean;
    emailVerified: Date | null;
    createdAt: Date;
  };
  photoUrl: string | null;
  prefs: Preferences;
  institute: { name: string; role: string } | null;
  /// XP per India day ("YYYY-MM-DD"), with what earned it.
  xp: Map<string, DayXp>;
  frozen: Set<string>;
  today: string;
  todayXp: number;
  /// Days this India week that met the daily goal.
  weekMet: number;
  streak: number;
  longest: number;
  bestDayXp: number;
  weeksMet: number;
  cardsKnown: number;
  submissions: number;
  audits: number;
  decks: { owned: number; shared: number; inLibrary: number; sharedOrListed: number; followers: number; following: number };
  scores: SkillScore[];
};

export async function studentProfile(userId: string): Promise<StudentProfile | null> {
  const reviewed = { studentId: userId, status: "REVIEWED" as const, feedback: { isNot: null } };
  const [user, xp, cardsKnown, submissions, audits, owned, shared, inLibrary, sharedOrListed, followers, following, recent, first] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        publicId: true,
        isGuest: true,
        emailVerified: true,
        createdAt: true,
        avatarKey: true,
        preferences: true,
        instituteMembership: { select: { role: true, institute: { select: { name: true } } } },
      },
    }),
    xpDays(userId),
    prisma.cardState.count({ where: { userId, known: true, word: { deckId: null } } }),
    prisma.submission.count({ where: { studentId: userId } }),
    prisma.submission.count({ where: reviewed }),
    prisma.deck.count({ where: { ownerId: userId, draftOfId: null } }),
    prisma.deck.count({ where: { ownerId: userId, draftOfId: null, shareToken: { not: null } } }),
    prisma.deck.count({ where: { ownerId: userId, visibility: "PUBLIC", status: "APPROVED" } }),
    // The "Shared a deck" badge, counted exactly as the dashboard counts it.
    prisma.deck.count({ where: { ownerId: userId, OR: [{ shareToken: { not: null } }, { visibility: "PUBLIC", status: "APPROVED" }] } }),
    prisma.deckFollow.count({ where: { deck: { ownerId: userId } } }),
    prisma.deckFollow.count({ where: { userId } }),
    // The same audits as the dashboard's skills: newest 50, and the first.
    prisma.submission.findMany({ where: reviewed, orderBy: { createdAt: "desc" }, take: 50, select: { feedback: { select: SCORES } } }),
    prisma.submission.findFirst({ where: reviewed, orderBy: { createdAt: "asc" }, select: { feedback: { select: SCORES } } }),
  ]);
  if (!user) return null;

  const prefs = prefsOf(user.preferences);
  const today = istDay(new Date());
  const byDay = xpMap(xp.days);
  // Settles any days not yet settled, the same call the dashboard makes.
  const freezes = await settleFreezes(userId, byDay, today, prefs.dailyGoalXp, prefs.weeklyGoalDays);
  const { avatarKey, preferences: _prefs, instituteMembership: m, ...rest } = user;
  return {
    user: rest,
    photoUrl: await avatarUrl(avatarKey),
    prefs,
    institute: m ? { name: m.institute.name, role: m.role.toLowerCase() } : null,
    xp: xp.days,
    frozen: freezes.frozen,
    today,
    todayXp: byDay.get(today) ?? 0,
    weekMet: weekOf(byDay, today, prefs.dailyGoalXp, freezes.frozen).met,
    streak: streakOf(byDay, today, freezes.frozen),
    longest: longestStreak(byDay, freezes.frozen),
    bestDayXp: bestDay(byDay),
    weeksMet: freezes.weeksMet,
    cardsKnown,
    submissions,
    audits,
    decks: { owned, shared, inLibrary, sharedOrListed, followers, following },
    scores: skillScores(
      recent.map((s) => s.feedback!),
      first?.feedback ?? null,
    ),
  };
}

/// An India day ("YYYY-MM-DD") as a day number, the calendar's unit.
export const dayNumberOf = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86_400_000;

/// Today's India day number, for components that mark "today".
export const todayNumber = () => dayNumberOf(istDay(new Date()));
