// Owns how the built-in Words are split into sections: by level, by topic, by
// word type and by importance, plus fixed-size packs inside a section.
//
// Everything here is worked out from columns the words already have (cefr,
// category, importance, the code prefix), so there is no new table and no data
// to load. A student's "section" is only a filter on the daily session, never
// a copy of the words.
//
// The 163 topic names in the sheet are far too many to browse, so they are
// folded into a dozen topics by the ordered rules below, first match wins. A
// category no rule claims lands in "More words" instead of vanishing, so every
// word is in exactly one topic. It deliberately does NOT touch student-made or
// imported deck cards (deckId is never null for those).

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const PACK_SIZE = 50;

export type Family = "goal" | "level" | "topic" | "type" | "must";
export type SectionDef = { key: string; family: Family; label: string; hint: string };

export const FAMILIES: { value: Family; title: string; blurb: string }[] = [
  { value: "goal", title: "By goal", blurb: "Words picked for what you are practising for." },
  { value: "level", title: "By level", blurb: "Start easy and move up." },
  { value: "topic", title: "By topic", blurb: "Learn the words for one part of life together." },
  { value: "type", title: "By word type", blurb: "Verbs, adjectives, phrasal verbs and more." },
  { value: "must", title: "By importance", blurb: "The words used most come first." },
];

const LEVELS: (SectionDef & { cefr: string[] })[] = [
  { key: "level-a1", family: "level", label: "A1 · Starter", hint: "Everyday basics", cefr: ["A1"] },
  { key: "level-a2", family: "level", label: "A2 · Elementary", hint: "Simple conversations", cefr: ["A2"] },
  { key: "level-b1", family: "level", label: "B1 and above", hint: "Opinions, work, longer talk", cefr: ["B1", "B2"] },
];

// Matched on the code prefix (VRB-002 → VRB), which is clean, unlike the free
// text part-of-speech column.
const TYPES: (SectionDef & { codes: string[] })[] = [
  { key: "type-verbs", family: "type", label: "Verbs", hint: "Actions and states", codes: ["VRB"] },
  { key: "type-adjectives", family: "type", label: "Adjectives", hint: "Describing words", codes: ["ADJ"] },
  { key: "type-adverbs", family: "type", label: "Adverbs", hint: "How, when, where", codes: ["ADV"] },
  { key: "type-nouns", family: "type", label: "Nouns", hint: "People, things, ideas", codes: ["NOU"] },
  { key: "type-phrasal", family: "type", label: "Phrasal verbs", hint: "Verb + small word", codes: ["PHR"] },
  {
    key: "type-grammar",
    family: "type",
    label: "Grammar words",
    hint: "Prepositions, pronouns, linking words",
    codes: ["PRP", "CNJ", "PRN", "DET", "AUX", "NUM", "INT"],
  },
];

const MUST: (SectionDef & { importance: number[] })[] = [
  { key: "must-top", family: "must", label: "Must-know", hint: "Importance 5 of 5", importance: [5] },
  { key: "must-mid", family: "must", label: "Important", hint: "Importance 4 of 5", importance: [4] },
  { key: "must-more", family: "must", label: "Extra", hint: "Importance 3 or less", importance: [1, 2, 3] },
];

// Ordered: the first rule that matches a category's lowercase name wins, so the
// specific ones (phrasal verbs, grammar words) sit above the broad ones.
const TOPIC_RULES: { key: string; label: string; hint: string; test: RegExp }[] = [
  { key: "topic-phrasal", label: "Phrasal verbs by theme", hint: "Daily life, work, digital", test: /^phrasal/ },
  {
    key: "topic-grammar",
    label: "Grammar and linking words",
    hint: "Prepositions, pronouns, modals, numbers",
    test: /preposition|pronoun|conjunction|connector|modal|auxiliary|quantifier|article|question words|negation|ordinal|cardinal|fractions|tens &|comparison structure|interjection|discourse|fillers|indefinite|reciprocal|focus & addition|time adverbs|sequence adverbs|frequency adverbs|manner adverbs|certainty adverbs|comparison adverbs|place & direction adverbs|degree & intensity adverbs/,
  },
  { key: "topic-tech", label: "Technology", hint: "Devices and the digital world", test: /technology|machines/ },
  { key: "topic-money", label: "Money and shopping", hint: "Buying, prices, numbers", test: /money|possession & exchange/ },
  { key: "topic-health", label: "Health and safety", hint: "Body, care, risk", test: /health|body|safety|precaution|physical state/ },
  { key: "topic-work", label: "Work, study and goals", hint: "Jobs, school, effort", test: /work|school|study|knowledge|goals|effort|try \/|rules & needs|priority|teaching/ },
  { key: "topic-travel", label: "Travel and places", hint: "Moving, places, directions", test: /travel|movement|places|place & direction|direction|action & movement/ },
  { key: "topic-time", label: "Time and frequency", hint: "When, how often, plans", test: /time|frequency|sequence|age &|plans|change & habits/ },
  { key: "topic-speaking", label: "Speaking and communication", hint: "Saying and explaining things", test: /communication|speaking|advice|promises|opinion|honesty|expressions/ },
  { key: "topic-feelings", label: "Feelings and thinking", hint: "Emotions, ideas, the senses", test: /emotion|feeling|mind|thinking|senses|perception|memory|interest|certainty|ideas|decision|choice|attention|mental/ },
  { key: "topic-people", label: "People and relationships", hint: "Family, friends, character", test: /people|family|social|personality|character|friends|appearance|physical description|society|relationship/ },
  { key: "topic-daily", label: "Daily life and home", hint: "Routines, food, things, weather", test: /daily|home|food|things|colour|weather|nature|sports|arts|routine/ },
  { key: "topic-quality", label: "Describing and doing", hint: "Quality, size, manner, common verbs", test: /quality|quantity|size|degree|manner|adjective|speed|difficulty|descriptions|states|change|making|creation|core action|start \/|state \/|helping|reasons|results|cause|comparison|certain/ },
];
// Goal tracks. The sheet has no exam or interview tag on any word, so a track
// is built honestly from what it does have: the topics a goal needs, the levels
// that suit it, and a minimum importance. It is a study path chosen by
// EduSarthi, NOT an official IELTS or employer word list, and the page says so.
// The `key` suffix matches the profile's goal value (lib/preferences GOALS).
type TrackRule = { topics: string[]; cefr?: string[]; minImportance: number };
const TRACKS: (SectionDef & { rule: TrackRule })[] = [
  {
    key: "goal-daily", family: "goal", label: "Daily English", hint: "Everyday topics, importance 4–5",
    rule: { topics: ["topic-daily", "topic-people", "topic-feelings", "topic-travel", "topic-time", "topic-money", "topic-health", "topic-speaking"], minImportance: 4 },
  },
  {
    key: "goal-interview", family: "goal", label: "Interviews", hint: "Work, speaking and character words, A2 and up",
    rule: { topics: ["topic-work", "topic-speaking", "topic-people", "topic-feelings", "topic-quality", "topic-phrasal"], cefr: ["A2", "B1", "B2"], minImportance: 4 },
  },
  {
    key: "goal-ielts", family: "goal", label: "IELTS and exams", hint: "A2–B2 words on common exam topics",
    rule: { topics: ["topic-work", "topic-tech", "topic-health", "topic-speaking", "topic-feelings", "topic-quality", "topic-people", "topic-travel", "topic-time", "topic-grammar"], cefr: ["A2", "B1", "B2"], minImportance: 4 },
  },
  {
    key: "goal-work", family: "goal", label: "Work English", hint: "Work, technology, money and speaking",
    rule: { topics: ["topic-work", "topic-tech", "topic-money", "topic-speaking", "topic-grammar"], minImportance: 3 },
  },
];

/// The track that matches a profile goal ("ielts" → goal-ielts), if any.
export function trackForGoal(goal: string | undefined | null): SectionDef | null {
  return TRACKS.find((t) => t.key === `goal-${goal}`) ?? null;
}

const TOPIC_MORE: SectionDef = { key: "topic-more", family: "topic", label: "More words", hint: "Everything else", };

const TOPIC_DEFS: SectionDef[] = [
  ...TOPIC_RULES.map((r) => ({ key: r.key, family: "topic" as const, label: r.label, hint: r.hint })),
  TOPIC_MORE,
];

export function topicKeyOf(category: string | null): string {
  const c = (category ?? "").toLowerCase();
  return TOPIC_RULES.find((r) => r.test.test(c))?.key ?? TOPIC_MORE.key;
}

export const ALL_SECTIONS: SectionDef[] = [...TRACKS, ...LEVELS, ...TOPIC_DEFS, ...TYPES, ...MUST];

export function sectionDef(key: string | undefined | null): SectionDef | null {
  return ALL_SECTIONS.find((s) => s.key === key) ?? null;
}

const BUILT_IN = { kind: "WORD", deckId: null } as const;

/// The Prisma filter for one section, or null for an unknown key. Topics need
/// the category list from the database to know which categories belong to them.
export async function sectionWhere(key: string): Promise<Prisma.WordWhereInput | null> {
  const level = LEVELS.find((s) => s.key === key);
  if (level) return { ...BUILT_IN, cefr: { in: level.cefr } };
  const type = TYPES.find((s) => s.key === key);
  if (type) return { ...BUILT_IN, OR: type.codes.map((c) => ({ code: { startsWith: `${c}-` } })) };
  const must = MUST.find((s) => s.key === key);
  if (must) return { ...BUILT_IN, importance: { in: must.importance } };
  const track = TRACKS.find((s) => s.key === key);
  if (track) {
    const cats = await prisma.word.groupBy({ by: ["category"], where: BUILT_IN });
    const names = cats.map((c) => c.category).filter((c): c is string => c !== null && track.rule.topics.includes(topicKeyOf(c)));
    return {
      ...BUILT_IN,
      category: { in: names },
      ...(track.rule.cefr ? { cefr: { in: track.rule.cefr } } : {}),
      importance: { gte: track.rule.minImportance },
    };
  }
  if (TOPIC_DEFS.some((s) => s.key === key)) {
    const cats = await prisma.word.groupBy({ by: ["category"], where: BUILT_IN });
    const names = cats.map((c) => c.category).filter((c): c is string => c !== null && topicKeyOf(c) === key);
    // Words with no category at all belong to "More words".
    const noCategory = key === TOPIC_MORE.key ? [{ category: null }] : [];
    return { ...BUILT_IN, OR: [{ category: { in: names } }, ...noCategory] };
  }
  return null;
}

/// The words of one pack (1-based) in learning order, as an id filter. A pack
/// is PACK_SIZE words by serial, so "Pack 3" always means the same words.
export async function packWhere(sectionFilter: Prisma.WordWhereInput, pack: number): Promise<Prisma.WordWhereInput> {
  const rows = await prisma.word.findMany({
    where: sectionFilter,
    orderBy: { serial: "asc" },
    skip: (pack - 1) * PACK_SIZE,
    take: PACK_SIZE,
    select: { id: true },
  });
  return { id: { in: rows.map((r) => r.id) } };
}

type Fact = { id: string; code: string; cefr: string | null; category: string | null; importance: number | null };

function keysOf(w: Fact): string[] {
  const keys: string[] = [];
  const lv = LEVELS.find((s) => w.cefr && s.cefr.includes(w.cefr));
  if (lv) keys.push(lv.key);
  const topic = topicKeyOf(w.category);
  keys.push(topic);
  for (const t of TRACKS) {
    const r = t.rule;
    if (r.topics.includes(topic) && (!r.cefr || (w.cefr !== null && r.cefr.includes(w.cefr))) && w.importance !== null && w.importance >= r.minImportance) {
      keys.push(t.key);
    }
  }
  const prefix = w.code.split("-")[0];
  const ty = TYPES.find((s) => s.codes.includes(prefix));
  if (ty) keys.push(ty.key);
  const mu = MUST.find((s) => w.importance !== null && s.importance.includes(w.importance));
  if (mu) keys.push(mu.key);
  return keys;
}

export type SectionStat = SectionDef & { total: number; known: number };

/// Every section with how many words it holds and how many this student knows.
/// One small read of the built-in words (about 2,200 short rows) plus the
/// student's known ids, then counted in memory, instead of a count query per
/// section on a slow connection. Scoped to `userId`.
export async function sectionStats(userId: string): Promise<{ stats: SectionStat[]; total: number; known: number }> {
  const [words, knownRows] = await Promise.all([
    prisma.word.findMany({ where: BUILT_IN, select: { id: true, code: true, cefr: true, category: true, importance: true } }),
    prisma.cardState.findMany({ where: { userId, known: true, word: BUILT_IN }, select: { wordId: true } }),
  ]);
  const known = new Set(knownRows.map((k) => k.wordId));
  const tally = new Map<string, { total: number; known: number }>();
  for (const w of words) {
    for (const k of keysOf(w)) {
      const t = tally.get(k) ?? { total: 0, known: 0 };
      t.total += 1;
      if (known.has(w.id)) t.known += 1;
      tally.set(k, t);
    }
  }
  const stats = ALL_SECTIONS.map((s) => ({ ...s, ...(tally.get(s.key) ?? { total: 0, known: 0 }) })).filter((s) => s.total > 0);
  return { stats, total: words.length, known: known.size };
}

export type PackStat = { n: number; from: number; to: number; total: number; known: number };

/// The packs of one section with the student's progress in each.
export async function packStats(userId: string, sectionFilter: Prisma.WordWhereInput): Promise<PackStat[]> {
  const [words, knownRows] = await Promise.all([
    prisma.word.findMany({ where: sectionFilter, orderBy: { serial: "asc" }, select: { id: true } }),
    prisma.cardState.findMany({ where: { userId, known: true, word: sectionFilter }, select: { wordId: true } }),
  ]);
  const known = new Set(knownRows.map((k) => k.wordId));
  const packs: PackStat[] = [];
  for (let i = 0; i < words.length; i += PACK_SIZE) {
    const slice = words.slice(i, i + PACK_SIZE);
    packs.push({ n: i / PACK_SIZE + 1, from: i + 1, to: i + slice.length, total: slice.length, known: slice.filter((w) => known.has(w.id)).length });
  }
  return packs;
}
