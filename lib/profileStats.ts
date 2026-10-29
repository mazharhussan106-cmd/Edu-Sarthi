// Owns the numbers on the student's Profile page: who they are, their streaks,
// cards known, audits, decks and today's plan, gathered in one round of
// parallel queries.
//
// Every query is scoped to the one user. Cards count only built-in ones
// (deckId null), the same rule as the daily session and lib/studentStats, so
// a student's own decks never inflate "cards known".
//
// It deliberately does NOT draw anything or decide wording; components/profile
// does. Teacher and admin numbers live in lib/staffProfileStats.

import { prisma } from "@/lib/prisma";
import { practiceDays, type PracticeDay } from "@/lib/practiceDays";
import { dayNumber, longestStreak, streakOfDays } from "@/lib/progress";
import { prefsOf, type Preferences } from "@/lib/preferences";

const IST = 5.5 * 3_600_000;

function startOfTodayIst(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST);
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
  prefs: Preferences;
  institute: { name: string; role: string } | null;
  practice: Map<number, PracticeDay>;
  streak: number;
  longest: number;
  cardsKnown: number;
  submissions: number;
  audits: number;
  recordingsToday: number;
  newCardsToday: number;
  decks: { owned: number; shared: number; inLibrary: number; followers: number; following: number };
};

export async function studentProfile(userId: string): Promise<StudentProfile | null> {
  const today = startOfTodayIst();
  const [user, practice, cardsKnown, submissions, audits, recordingsToday, newCardsToday, owned, shared, inLibrary, followers, following] =
    await Promise.all([
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
          preferences: true,
          instituteMembership: { select: { role: true, institute: { select: { name: true } } } },
        },
      }),
      practiceDays(userId),
      prisma.cardState.count({ where: { userId, known: true, word: { deckId: null } } }),
      prisma.submission.count({ where: { studentId: userId } }),
      prisma.submission.count({ where: { studentId: userId, status: "REVIEWED" } }),
      prisma.submission.count({ where: { studentId: userId, createdAt: { gte: today } } }),
      // Same rule as the daily limit in lib/flashcards: a new word card is one
      // first answered today.
      prisma.cardState.count({ where: { userId, reviews: { gt: 0 }, createdAt: { gte: today }, word: { kind: "WORD", deckId: null } } }),
      prisma.deck.count({ where: { ownerId: userId, draftOfId: null } }),
      prisma.deck.count({ where: { ownerId: userId, draftOfId: null, shareToken: { not: null } } }),
      prisma.deck.count({ where: { ownerId: userId, visibility: "PUBLIC", status: "APPROVED" } }),
      prisma.deckFollow.count({ where: { deck: { ownerId: userId } } }),
      prisma.deckFollow.count({ where: { userId } }),
    ]);
  if (!user) return null;

  const days = new Set(practice.keys());
  return {
    user,
    prefs: prefsOf(user.preferences),
    institute: user.instituteMembership
      ? { name: user.instituteMembership.institute.name, role: user.instituteMembership.role.toLowerCase() }
      : null,
    practice,
    streak: streakOfDays(days),
    longest: longestStreak(days),
    cardsKnown,
    submissions,
    audits,
    recordingsToday,
    newCardsToday,
    decks: { owned, shared, inLibrary, followers, following },
  };
}

/// Today's India day number, for components that mark "today".
export const todayNumber = () => dayNumber(new Date());
