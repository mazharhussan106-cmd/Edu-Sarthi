// Owns the numbers behind the student's progress views: the week's activity,
// how the flashcards stand, and how each rubric score moved. The dashboard and
// the Progress page both read these, so they can never disagree.
//
// It deliberately counts only built-in cards (deckId null), the same rule as
// the daily session; student-made decks would otherwise inflate "known".
// Every query is scoped to the one user.

import { prisma } from "@/lib/prisma";

export const CRITERIA = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "grammar", label: "Grammar" },
  { key: "fluency", label: "Fluency" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "confidence", label: "Confidence" },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];

const DAY = 86_400_000;
// India's calendar day, because that is the day the student lives in. UTC would
// flip "today" at 5:30 am and split a late-evening session across two bars.
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export type ActivityDay = { label: string; recordings: number; cards: number };

export async function weeklyActivity(userId: string): Promise<ActivityDay[]> {
  const now = new Date();
  const since = new Date(now.getTime() - 7 * DAY);
  const [subs, reviews] = await Promise.all([
    prisma.submission.findMany({ where: { studentId: userId, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.cardState.findMany({
      where: { userId, lastReviewedAt: { gte: since }, word: { deckId: null } },
      select: { lastReviewedAt: true },
      take: 2000,
    }),
  ]);
  const days: ActivityDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    const key = dayKey(d);
    days.push({
      label: d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }),
      recordings: subs.filter((s) => dayKey(s.createdAt) === key).length,
      // lastReviewedAt keeps only each card's latest review, so a card
      // reviewed twice this week counts once, on its last day. Close enough
      // for a bar chart about habit, not an audit log.
      cards: reviews.filter((r) => r.lastReviewedAt && dayKey(r.lastReviewedAt) === key).length,
    });
  }
  return days;
}

export type CardProgressData = {
  seen: number;
  known: number;
  unknown: number;
  doubt: number;
  weakTopics: { name: string; count: number }[];
};

export async function cardProgress(userId: string): Promise<CardProgressData> {
  const built = { word: { deckId: null } };
  const [seen, known, doubt, weak] = await Promise.all([
    prisma.cardState.count({ where: { userId, reviews: { gt: 0 }, ...built } }),
    prisma.cardState.count({ where: { userId, known: true, ...built } }),
    prisma.cardState.count({ where: { userId, doubt: true, ...built } }),
    // A "weak" card is one the student flagged as a doubt, or marked unknown
    // with hard recall. Grouped by category in code: a relation field cannot
    // be grouped on in Prisma.
    prisma.cardState.findMany({
      where: { userId, ...built, OR: [{ doubt: true }, { known: false, reviews: { gt: 0 }, recall: "HARD" }] },
      select: { word: { select: { kind: true, category: true } } },
      take: 500,
    }),
  ]);
  const tally = new Map<string, number>();
  for (const w of weak) {
    const name = w.word.category ?? { WORD: "Words", CHUNK: "Chunks", GRAMMAR: "Grammar" }[w.word.kind];
    tally.set(name, (tally.get(name) ?? 0) + 1);
  }
  const weakTopics = [...tally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  return { seen, known, unknown: Math.max(0, seen - known), doubt, weakTopics };
}

export type CriterionChange = { label: string; first: number; latest: number };

/// First audit against latest audit, per criterion. Needs two audits to say
/// anything about movement, so it returns null with fewer.
export function criteriaChange(
  audits: readonly Record<CriterionKey, number>[],
): CriterionChange[] | null {
  if (audits.length < 2) return null;
  const first = audits[0];
  const latest = audits[audits.length - 1];
  return CRITERIA.map((c) => ({ label: c.label, first: first[c.key], latest: latest[c.key] }));
}
