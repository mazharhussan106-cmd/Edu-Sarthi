// Owns the numbers behind the student's progress views: the week's activity,
// how the flashcards stand, and how each rubric score moved. The dashboard and
// the Progress page both read these, so they can never disagree.
//
// It deliberately counts only built-in cards (deckId null), the same rule as
// the daily session; student-made decks would otherwise inflate "known".
// Every query is scoped to the one user.

import { Prisma, type CardKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { channelLabel } from "@/lib/supportCard";
import { SKILL_FOCUS, type SkillFocus } from "@/lib/skillFocus";
import { DECK_KINDS } from "@/components/flashcards/DeckTopBar";

const KIND_NAME: Record<CardKind, string> = { WORD: "Words", CHUNK: "Chunks", GRAMMAR: "Grammar", SUPPORT: "Support" };


// The rubric's five skills come from lib/skillFocus (no database there, so
// the admin form can read them too); one list, so a renamed skill changes
// everywhere at once.
export const CRITERIA = SKILL_FOCUS.map((s) => ({ key: s.value, label: s.label }));

export type CriterionKey = SkillFocus;

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
      // Newest first, so if the cap bites it trims the oldest day, not today.
      orderBy: { lastReviewedAt: "desc" },
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
    // A support card's category is its channel ("voice"), which means nothing
    // on its own, so it is named with the tab it belongs to.
    const name =
      w.word.kind === "SUPPORT"
        ? `Support · ${channelLabel(w.word.category)}`
        : w.word.category ?? KIND_NAME[w.word.kind];
    tally.set(name, (tally.get(name) ?? 0) + 1);
  }
  const weakTopics = [...tally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  return { seen, known, unknown: Math.max(0, seen - known), doubt, weakTopics };
}

export type KindKnown = { kind: CardKind; label: string; known: number; total: number };

/// Known out of all built-in cards, per kind, for the dashboard's flashcard
/// card. Grouped in SQL: a count per kind would be four round trips on the
/// one-connection live pool.
export async function knownByKind(userId: string): Promise<KindKnown[]> {
  const [totals, known] = await Promise.all([
    prisma.word.groupBy({ by: ["kind"], where: { deckId: null }, _count: true }),
    prisma.$queryRaw<{ kind: CardKind; n: number }[]>(Prisma.sql`
      SELECT w."kind"::text AS kind, COUNT(*)::int AS n
      FROM "CardState" cs JOIN "Word" w ON w."id" = cs."wordId"
      WHERE cs."userId" = ${userId} AND cs."known" = true AND w."deckId" IS NULL
      GROUP BY w."kind"`),
  ]);
  // The Flashcard tab's own names and order, for rows beside links to those tabs.
  return DECK_KINDS.map(({ kind, label }) => ({ kind, label }))
    .map(({ kind, label }) => ({
      kind: kind as CardKind,
      label,
      known: known.find((k) => k.kind === kind)?.n ?? 0,
      total: totals.find((t) => t.kind === kind)?._count ?? 0,
    }))
    .filter((k) => k.total > 0);
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
