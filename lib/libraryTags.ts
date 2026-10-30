// Owns "which topics are in use in the library, and how many decks has each":
// the row of topic chips on /library, so a visitor can browse without knowing a
// tag to type.
//
// It counts only listed decks (lib/decks LISTED), so a topic held by nothing but
// a pending, withdrawn or suspended deck never shows, and a count never
// includes a deck the visitor cannot open. A deck counts once per topic however
// often it repeats it.
//
// It reads every listed deck's tags and counts here, because Prisma cannot
// group on an array column and a raw query would repeat the LISTED rules where
// they could drift. That is cheap for hundreds of decks; at a few thousand,
// replace it with one SQL aggregate.

import { prisma } from "@/lib/prisma";
import { LISTED } from "@/lib/decks";

export type LibraryTag = { tag: string; count: number };

export async function libraryTags(): Promise<LibraryTag[]> {
  const rows = await prisma.deck.findMany({ where: LISTED, select: { tags: true } });
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const tag of new Set(row.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  // Most used first; the name breaks a tie so the row never reshuffles.
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
