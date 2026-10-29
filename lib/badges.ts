// Owns the badge rules. A badge is worked out from numbers the app already has
// every time the profile or dashboard loads; nothing is stored.
//
// That is deliberate: a stored badge needs a table, a migration and a job that
// awards it, and it can drift from the truth (a deleted deck would keep its
// badge). Computed badges are always accurate, and cost one pass over stats.
//
// The thresholds are small on purpose. A badge a student can earn this week
// does more for a habit than one they will meet in a year.
//
// Streak badges count learning days (any study worth 10 XP, lib/streak), not
// only recordings, and are earned from the longest streak, so one missed day
// does not take a badge away.

export type BadgeStats = {
  submissions: number;
  audits: number;
  /// The streak running now, for "how far to go".
  streak: number;
  /// The longest streak in the history we have, for "earned".
  longestStreak: number;
  cardsKnown: number;
  decks: number;
  bestDayXp: number;
};

export type Badge = {
  id: string;
  label: string;
  hint: string;
  earned: boolean;
  have: number;
  need: number;
  /// What "need" counts, for "18 days to go".
  unit: string;
};

type Rule = { id: string; label: string; hint: string; need: number; unit: string; have: (s: BadgeStats) => number; best?: (s: BadgeStats) => number };

const RULES: readonly Rule[] = [
  { id: "first-recording", label: "First recording", hint: "Send one recording", need: 1, unit: "recording", have: (s) => s.submissions },
  { id: "first-audit", label: "First audit", hint: "Get one audit back", need: 1, unit: "audit", have: (s) => s.audits },
  { id: "five-audits", label: "Five audits", hint: "Get five audits back", need: 5, unit: "audit", have: (s) => s.audits },
  { id: "ten-recordings", label: "10 recordings", hint: "Send ten recordings", need: 10, unit: "recording", have: (s) => s.submissions },
  { id: "streak-3", label: "3-day streak", hint: "Learn 3 days in a row", need: 3, unit: "day", have: (s) => s.streak, best: (s) => s.longestStreak },
  { id: "streak-7", label: "7-day streak", hint: "Learn 7 days in a row", need: 7, unit: "day", have: (s) => s.streak, best: (s) => s.longestStreak },
  { id: "streak-30", label: "30-day streak", hint: "Learn 30 days in a row", need: 30, unit: "day", have: (s) => s.streak, best: (s) => s.longestStreak },
  { id: "known-30", label: "30 cards known", hint: "Mark 30 cards known", need: 30, unit: "card", have: (s) => s.cardsKnown },
  { id: "known-100", label: "100 cards known", hint: "Mark 100 cards known", need: 100, unit: "card", have: (s) => s.cardsKnown },
  { id: "known-500", label: "500 cards known", hint: "Mark 500 cards known", need: 500, unit: "card", have: (s) => s.cardsKnown },
  { id: "xp-100-day", label: "100-XP day", hint: "Earn 100 XP in one day", need: 100, unit: "XP", have: (s) => s.bestDayXp },
  { id: "deck-maker", label: "Deck maker", hint: "Make your own deck", need: 1, unit: "deck", have: (s) => s.decks },
];

export function badgesFor(s: BadgeStats): Badge[] {
  return RULES.map((r) => {
    const earned = (r.best ?? r.have)(s) >= r.need;
    return { id: r.id, label: r.label, hint: r.hint, earned, have: Math.min(r.have(s), r.need), need: r.need, unit: r.unit };
  });
}

/// The unearned badge closest to done, so the dashboard can say "2 days to
/// go". Ties go to the smaller target, which is the sooner win.
export function nextBadge(badges: readonly Badge[]): Badge | null {
  const open = badges.filter((b) => !b.earned);
  if (open.length === 0) return null;
  return [...open].sort((a, b) => b.have / b.need - a.have / a.need || a.need - b.need)[0];
}

export function toGo(b: Badge): string {
  const left = b.need - b.have;
  return `${left.toLocaleString("en-IN")} ${b.unit}${left === 1 || b.unit === "XP" ? "" : "s"} to go`;
}
