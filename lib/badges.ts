// Owns the badge rules. A badge is worked out from numbers the app already has
// every time the profile loads; nothing is stored.
//
// That is deliberate: a stored badge needs a table, a migration and a job that
// awards it, and it can drift from the truth (a deleted deck would keep its
// badge). Computed badges are always accurate, and cost one pass over stats.
//
// The thresholds are small on purpose. A badge a student can earn this week
// does more for a habit than one they will meet in a year.

export type BadgeStats = {
  submissions: number;
  audits: number;
  streak: number;
  cardsKnown: number;
  decks: number;
};

export type Badge = { id: string; label: string; hint: string; earned: boolean };

export function badgesFor(s: BadgeStats): Badge[] {
  return [
    { id: "first-recording", label: "First recording", hint: "Send one recording", earned: s.submissions >= 1 },
    { id: "first-audit", label: "First audit", hint: "Get one audit back", earned: s.audits >= 1 },
    { id: "five-audits", label: "Five audits", hint: "Get five audits back", earned: s.audits >= 5 },
    { id: "streak-3", label: "3-day streak", hint: "Record 3 days in a row", earned: s.streak >= 3 },
    { id: "streak-7", label: "7-day streak", hint: "Record 7 days in a row", earned: s.streak >= 7 },
    { id: "known-30", label: "30 cards known", hint: "Mark 30 cards known", earned: s.cardsKnown >= 30 },
    { id: "known-100", label: "100 cards known", hint: "Mark 100 cards known", earned: s.cardsKnown >= 100 },
    { id: "deck-maker", label: "Deck maker", hint: "Make your own deck", earned: s.decks >= 1 },
  ];
}
