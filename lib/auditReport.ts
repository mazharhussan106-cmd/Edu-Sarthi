// Owns the rules behind the student's audit report: what each skill means,
// which word a score earns, which notes count as "fix these first", the
// teacher's opening line, how each skill moved, and where "Try again" goes.
//
// It deliberately has no Prisma and no React. It maps values the page already
// read, so the rules can be checked on their own and reused without dragging
// the database into a client bundle.

import type { NoteInput } from "@/lib/validations";

/// The meaning lines are student-facing only; teachers see just the names.
/// If a teacher-side definition is ever added, it must say the same thing.
export const SKILLS = [
  { key: "pronunciation", label: "Pronunciation", meaning: "How clearly your sounds and word stress come across." },
  { key: "grammar", label: "Grammar", meaning: "How correctly you build sentences." },
  { key: "fluency", label: "Fluency", meaning: "How smoothly you speak, without long pauses or restarts." },
  { key: "vocabulary", label: "Vocabulary", meaning: "How well your words fit what you mean." },
  { key: "confidence", label: "Confidence", meaning: "How steadily and clearly you deliver." },
] as const;

export type SkillKey = (typeof SKILLS)[number]["key"];
export type SkillScores = Record<SkillKey, number>;

/// Words, not levels. Our rubric is not mapped to CEFR or IELTS, so a band
/// says how this score reads on our own 0-10 scale and claims nothing more.
export function bandFor(score: number): string {
  if (score < 4) return "Needs work";
  if (score < 6) return "Developing";
  if (score < 8) return "Good";
  return "Strong";
}

/// How many notes the top card holds. Three is what a student acts on before
/// trying again; more turns the top of the page back into the full list.
export const TOP_FIXES = 3;

/// Major notes first, then by time, so the card leads with what costs most and
/// still reads in the order the student said it.
export function topFixes(notes: readonly NoteInput[]): NoteInput[] {
  const rank = (n: NoteInput) => (n.severity === "major" ? 0 : 1);
  return [...notes]
    .sort((a, b) => rank(a) - rank(b) || a.at - b.at)
    .slice(0, TOP_FIXES);
}

const LINE_MAX = 160;

/// The teacher's first sentence for the top of the page. `whole` tells the
/// page the summary has nothing more, so it is not printed twice.
export function openingLine(summary: string): { line: string; whole: boolean } {
  const text = summary.trim();
  const firstLine = text.split(/\n/)[0].trim();
  const end = firstLine.search(/[.!?](\s|$)/);
  let line = end === -1 ? firstLine : firstLine.slice(0, end + 1);
  if (line.length > LINE_MAX) {
    // Cut at a word, never mid-word, or the line reads like a typo.
    const cut = line.slice(0, LINE_MAX);
    line = `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : LINE_MAX).trimEnd()}…`;
  }
  return { line, whole: line === text };
}

export function overallOf(s: SkillScores): number {
  return SKILLS.reduce((sum, k) => sum + s[k.key], 0) / SKILLS.length;
}

export type SkillRow = {
  key: SkillKey;
  label: string;
  meaning: string;
  score: number;
  band: string;
  /// Null on a first audit: there is nothing to compare with.
  change: number | null;
};

export function skillRows(current: SkillScores, previous: SkillScores | null): SkillRow[] {
  return SKILLS.map((s) => ({
    key: s.key,
    label: s.label,
    meaning: s.meaning,
    score: current[s.key],
    band: bandFor(current[s.key]),
    change: previous ? current[s.key] - previous[s.key] : null,
  }));
}

/// Lowest and highest skills, ties named together. Null when every score is
/// the same: "focus on everything" helps nobody.
export function focusAndStrength(
  s: SkillScores,
): { focus: string[]; strongest: string[]; low: number; high: number } | null {
  const values = SKILLS.map((k) => s[k.key]);
  const low = Math.min(...values);
  const high = Math.max(...values);
  if (low === high) return null;
  return {
    focus: SKILLS.filter((k) => s[k.key] === low).map((k) => k.label),
    strongest: SKILLS.filter((k) => s[k.key] === high).map((k) => k.label),
    low,
    high,
  };
}

/// Where "Try again" goes. A flashcard recording returns to its card: a
/// built-in card through the exercise's ?word=, a deck card through its deck's
/// practice page. Without this the student lands on the bare exercise and the
/// card is lost.
export function retryHref(
  exerciseId: string,
  word: { id: string; code: string; deckId: string | null } | null,
): string {
  if (!word) return `/practice/${exerciseId}`;
  if (word.deckId) return `/library/${word.deckId}/practice/${word.id}`;
  return `/practice/${exerciseId}?word=${encodeURIComponent(word.code)}`;
}
