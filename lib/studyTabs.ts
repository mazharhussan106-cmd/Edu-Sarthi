// Owns a student's study tabs (layer 1 of the Flashcard filters): reading them
// in order, making, renaming, deleting, arranging and hiding them, and which
// decks an own tab holds. Every query names the student, so nobody can read or
// change another person's tabs by guessing an id.
//
// The two built-in tabs (English, My decks) have no row until the student first
// saves anything; until then they are shown in the default order. That keeps
// the Flashcard tab working for everyone who never touches tabs, and before
// Database setup has made the tables (AreaTabs catches the error).
//
// It deliberately does NOT check the session or parse input: the API route
// does both (lib/studyTabSchemas), then calls these with a trusted user id.

import type { Prisma, StudyTabKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { LISTED, LimitReached, lockUser } from "@/lib/decks";
import { TAB_LIMITS, type BuiltInKey } from "@/lib/studyTabSchemas";

export type TabView = { key: string; label: string; href: string; hidden: boolean; own: boolean };
type Result = { ok: true; id?: string } | { error: string };

const BUILT_IN: Record<BuiltInKey, { kind: StudyTabKind; label: string; href: string }> = {
  english: { kind: "ENGLISH", label: "English", href: "/flashcards" },
  decks: { kind: "DECKS", label: "My decks", href: "/decks" },
};
const keyOf = (t: { id: string; kind: StudyTabKind }): string => (t.kind === "ENGLISH" ? "english" : t.kind === "DECKS" ? "decks" : t.id);
const TX = { maxWait: 10_000, timeout: 20_000 };
const GONE = "That tab no longer exists. It may have been deleted on another device.";

/// Decks a student may put in a tab: their own, the ones they follow and the
/// ones shared with them by name. Never a new version's working copy.
export function tabbableBy(userId: string): Prisma.DeckWhereInput {
  return { draftOfId: null, OR: [{ ownerId: userId }, { follows: { some: { userId } } }, { members: { some: { userId, acceptedAt: { not: null } } } }] };
}

/// Every tab in the student's order, hidden ones included (the caller decides).
export async function tabsFor(userId: string): Promise<TabView[]> {
  const rows = await prisma.studyTab.findMany({ where: { userId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true, kind: true, name: true, hidden: true } });
  const views: TabView[] = rows.map((r) => {
    const b = r.kind === "OWN" ? null : BUILT_IN[keyOf(r) as BuiltInKey];
    return { key: keyOf(r), label: b ? b.label : r.name ?? "Tab", href: b ? b.href : `/tabs/${r.id}`, hidden: r.hidden, own: !b };
  });
  // A built-in tab without a row is shown in front, in its default order.
  const missing = (Object.keys(BUILT_IN) as BuiltInKey[]).filter((k) => !views.some((v) => v.key === k));
  return [...missing.map((k) => ({ key: k, label: BUILT_IN[k].label, href: BUILT_IN[k].href, hidden: false, own: false })), ...views];
}

/// Gives the built-in tabs rows, in front, the first time anything is saved.
async function ensureBuiltIns(tx: Prisma.TransactionClient, userId: string) {
  const have = await tx.studyTab.findMany({ where: { userId, kind: { in: ["ENGLISH", "DECKS"] } }, select: { kind: true } });
  const add = (["ENGLISH", "DECKS"] as const).filter((k) => !have.some((h) => h.kind === k));
  if (!add.length) return;
  // Shift every existing row back so the new ones can take the front places.
  await tx.studyTab.updateMany({ where: { userId }, data: { position: { increment: add.length } } });
  await tx.studyTab.createMany({ data: add.map((kind, i) => ({ userId, kind, position: i })) });
}

async function makeTab(tx: Prisma.TransactionClient, userId: string, name: string): Promise<string> {
  await ensureBuiltIns(tx, userId);
  if ((await tx.studyTab.count({ where: { userId, kind: "OWN" } })) >= TAB_LIMITS.ownTabs) throw new LimitReached();
  const last = await tx.studyTab.aggregate({ where: { userId }, _max: { position: true } });
  const tab = await tx.studyTab.create({ data: { userId, name, position: (last._max.position ?? 0) + 1 }, select: { id: true } });
  return tab.id;
}

const tooMany = { error: `You have ${TAB_LIMITS.ownTabs} tabs, the most allowed. Delete one you no longer use, then try again.` };

export async function createTab(userId: string, name: string): Promise<Result> {
  try {
    // Count and insert under one per-user lock, so parallel taps cannot all
    // pass the limit before any of them has saved a tab.
    const id = await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);
      return makeTab(tx, userId, name);
    }, TX);
    return { ok: true, id };
  } catch (e) {
    if (e instanceof LimitReached) return tooMany;
    throw e;
  }
}

export async function renameTab(userId: string, id: string, name: string): Promise<Result> {
  const r = await prisma.studyTab.updateMany({ where: { id, userId, kind: "OWN" }, data: { name } });
  return r.count ? { ok: true } : { error: GONE };
}

/// Removes the tab and its links only; the decks, their cards and everyone's
/// progress stay (StudyTabDeck cascades, Deck does not).
export async function deleteTab(userId: string, id: string): Promise<Result> {
  const r = await prisma.studyTab.deleteMany({ where: { id, userId, kind: "OWN" } });
  return r.count ? { ok: true } : { error: GONE };
}

export async function arrangeTabs(userId: string, tabs: { key: string; hidden: boolean }[]): Promise<Result> {
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    await ensureBuiltIns(tx, userId);
    const rows = await tx.studyTab.findMany({ where: { userId }, select: { id: true, kind: true } });
    const byKey = new Map(rows.map((r) => [keyOf(r), r.id]));
    // The same set of tabs, each once: anything else means the list on screen
    // is out of date (a tab made or deleted on another device).
    const keys = tabs.map((t) => t.key);
    if (keys.length !== byKey.size || new Set(keys).size !== keys.length || !keys.every((k) => byKey.has(k))) {
      return { error: "Your tabs changed on another device. Close this, open it again and arrange them once more." };
    }
    for (const [i, t] of tabs.entries()) {
      await tx.studyTab.update({ where: { id: byKey.get(t.key)! }, data: { position: i, hidden: t.hidden } });
    }
    return { ok: true } as Result;
  }, TX);
}

/// Replaces the decks an own tab holds. Decks the student may not open are
/// refused outright rather than silently dropped, so the sheet can say so.
export async function setTabDecks(userId: string, id: string, deckIds: string[]): Promise<Result> {
  const tab = await prisma.studyTab.findFirst({ where: { id, userId, kind: "OWN" }, select: { id: true } });
  if (!tab) return { error: GONE };
  const ids = [...new Set(deckIds)];
  const allowed = await prisma.deck.count({ where: { id: { in: ids }, ...tabbableBy(userId) } });
  if (allowed !== ids.length) return { error: "One of those decks is no longer yours to study. Close this, open it again and pick again." };
  await prisma.$transaction([
    prisma.studyTabDeck.deleteMany({ where: { tabId: id, deckId: { notIn: ids } } }),
    prisma.studyTabDeck.createMany({ data: ids.map((deckId) => ({ tabId: id, deckId })), skipDuplicates: true }),
  ]);
  return { ok: true };
}

export async function removeDeck(userId: string, id: string, deckId: string): Promise<Result> {
  await prisma.studyTabDeck.deleteMany({ where: { tabId: id, deckId, tab: { userId } } });
  return { ok: true };
}

/// Where one deck shows: exactly the own tabs given, plus a new one if named.
/// Asked right after a copy or import (decision 11 in the plan).
export async function placeDeck(userId: string, deckId: string, tabIds: string[], newTab?: string): Promise<Result> {
  if (!(await prisma.deck.count({ where: { id: deckId, ...tabbableBy(userId) } }))) {
    return { error: "That deck is not in your decks any more. Open My decks to check." };
  }
  try {
    await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);
      const mine = await tx.studyTab.findMany({ where: { userId, kind: "OWN" }, select: { id: true } });
      const want = new Set(tabIds.filter((t) => mine.some((m) => m.id === t)));
      if (newTab) want.add(await makeTab(tx, userId, newTab));
      // Full tabs are skipped, not failed: the deck still lands everywhere else.
      const counts = await tx.studyTabDeck.groupBy({ by: ["tabId"], where: { tabId: { in: [...want] } }, _count: { _all: true } });
      const full = new Set(counts.filter((c) => c._count._all >= TAB_LIMITS.decksPerTab).map((c) => c.tabId));
      await tx.studyTabDeck.deleteMany({ where: { deckId, tab: { userId }, tabId: { notIn: [...want] } } });
      await tx.studyTabDeck.createMany({ data: [...want].filter((t) => !full.has(t)).map((tabId) => ({ tabId, deckId })), skipDuplicates: true });
    }, TX);
  } catch (e) {
    if (e instanceof LimitReached) return tooMany;
    throw e;
  }
  return { ok: true };
}

/// The student's own tabs, and whether the given deck is already in each.
export async function ownTabs(userId: string, deckId?: string) {
  const rows = await prisma.studyTab.findMany({
    where: { userId, kind: "OWN" },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, decks: deckId ? { where: { deckId }, select: { deckId: true } } : false },
  });
  return rows.map((r) => ({ id: r.id, name: r.name ?? "Tab", has: Boolean(deckId && r.decks?.length) }));
}

/// One own tab and the decks in it that the student can still open, with what
/// a row needs: size, cards due, and where Study goes.
export async function tabPage(userId: string, id: string) {
  const tab = await prisma.studyTab.findFirst({ where: { id, userId, kind: "OWN" }, select: { id: true, name: true } });
  if (!tab) return null;
  const decks = await prisma.deck.findMany({
    where: { ...tabbableBy(userId), inTabs: { some: { tabId: id } } },
    orderBy: { title: "asc" },
    select: { id: true, title: true, ownerId: true, visibility: true, status: true, members: { where: { userId, acceptedAt: { not: null } }, select: { id: true } }, _count: { select: { cards: true } } },
  });
  const listed = new Set(
    (await prisma.deck.findMany({ where: { id: { in: decks.map((d) => d.id) }, ...LISTED }, select: { id: true } })).map((d) => d.id),
  );
  // Due per deck: one read of the due cards' decks, however many decks.
  const dueRows = await prisma.cardState.findMany({
    where: { userId, reviews: { gt: 0 }, dueAt: { lte: new Date() }, word: { deckId: { in: decks.map((d) => d.id) } } },
    select: { word: { select: { deckId: true } } },
  });
  const due = new Map<string, number>();
  for (const r of dueRows) if (r.word.deckId) due.set(r.word.deckId, (due.get(r.word.deckId) ?? 0) + 1);
  return {
    tab: { id: tab.id, name: tab.name ?? "Tab" },
    decks: decks.map((d) => {
      // Own and shared decks study on /decks; a followed one on the library's page.
      const followed = d.ownerId !== userId && !d.members.length;
      return { id: d.id, title: d.title, cards: d._count.cards, due: due.get(d.id) ?? 0, href: followed ? `/library/${d.id}/study` : `/decks/${d.id}/study`, available: !followed || listed.has(d.id) };
    }),
  };
}

/// Every deck the student could put in a tab, for the Add decks sheet.
export async function tabbableDecks(userId: string) {
  return prisma.deck.findMany({ where: tabbableBy(userId), orderBy: { title: "asc" }, select: { id: true, title: true }, take: 300 });
}
