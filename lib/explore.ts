// Owns what the Explore page lists: how many built-in cards exist, and the
// approved library decks grouped by subject.
//
// It reads only what is public — built-in cards (deckId null) and decks that an
// admin has approved — so nothing here is per-user and there is nothing to
// scope. "Subject" is a deck's tag; a deck with several tags appears under
// each, and one with none goes under "More decks".

import { prisma } from "@/lib/prisma";
import { LISTED } from "@/lib/decks";
import { CREDIT_INSTITUTE_SELECT, CREDIT_SELECT, type CreditInstitute, type CreditOwner } from "@/lib/libraryTerms";

export type BuiltIn = { words: number; chunks: number; grammar: number; support: number; chunkTypes: { type: string; count: number }[] };

export async function builtInCounts(): Promise<BuiltIn> {
  const built = { deckId: null };
  const [words, chunks, grammar, support, types] = await Promise.all([
    prisma.word.count({ where: { kind: "WORD", ...built } }),
    prisma.word.count({ where: { kind: "CHUNK", ...built } }),
    prisma.word.count({ where: { kind: "GRAMMAR", ...built } }),
    prisma.word.count({ where: { kind: "SUPPORT", ...built } }),
    prisma.word.groupBy({ by: ["category"], where: { kind: "CHUNK", ...built }, _count: true }),
  ]);
  return {
    words,
    chunks,
    grammar,
    support,
    chunkTypes: types.filter((t) => t.category).map((t) => ({ type: t.category as string, count: t._count })),
  };
}

export type ExploreDeck = { id: string; title: string; cards: number; teacherVerified: boolean; official: boolean; owner: CreditOwner; institute: CreditInstitute | null; licence: string | null };
export type Subject = { name: string; total: number; decks: ExploreDeck[] };

const MORE = "More decks";

export async function librarySubjects(perSubject = 6, maxSubjects = 12): Promise<Subject[]> {
  const decks = await prisma.deck.findMany({
    where: LISTED,
    // Most copied first, so what other learners actually use leads each subject.
    orderBy: [{ copyCount: "desc" }, { reviewedAt: "desc" }],
    take: 200,
    select: {
      id: true,
      title: true,
      tags: true,
      licence: true,
      ...CREDIT_INSTITUTE_SELECT,
      owner: { select: { ...CREDIT_SELECT, teacherVerifiedAt: true } },
      _count: { select: { cards: true } },
    },
  });

  const groups = new Map<string, ExploreDeck[]>();
  for (const d of decks) {
    const row: ExploreDeck = {
      id: d.id,
      title: d.title,
      cards: d._count.cards,
      teacherVerified: d.owner.role === "TEACHER" && Boolean(d.owner.teacherVerifiedAt),
      official: d.owner.role === "ADMIN",
      owner: { role: d.owner.role, name: d.owner.name, creditStyle: d.owner.creditStyle, publicName: d.owner.publicName },
      institute: d.institute,
      licence: d.licence,
    };
    const names = d.tags.length ? d.tags : [MORE];
    for (const t of names) groups.set(t, [...(groups.get(t) ?? []), row]);
  }
  return [...groups.entries()]
    .map(([name, rows]) => ({ name, total: rows.length, decks: rows.slice(0, perSubject) }))
    // "More decks" always last, the rest by how many decks they hold.
    .sort((a, b) => (a.name === MORE ? 1 : b.name === MORE ? -1 : b.total - a.total))
    .slice(0, maxSubjects);
}
