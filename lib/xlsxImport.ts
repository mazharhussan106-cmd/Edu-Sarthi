// Owns saving parsed Excel cards as a published deck owned by the admin who
// uploaded them. Cards are matched by their ID (stored as Word.code): an ID
// that exists is updated, a new ID is added, nothing is ever deleted — so a
// student's review progress, which hangs off the card row, survives a re-upload.
//
// The upload may be re-run safely if it stops halfway: new cards are inserted
// with skipDuplicates and only cards whose content changed are written again.
// It deliberately does NOT parse the file (lib/xlsxCards) or check who is
// calling (the route does), and it never runs card code.

import type { Prisma } from "@prisma/client";

import { logAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { ParsedCard } from "@/lib/xlsxCards";

export type ImportResult = { ok: true; deckId: string; created: number; updated: number } | { error: string };

function wordData(c: ParsedCard) {
  const f = c.fields;
  return {
    text: f.term.slice(0, 200),
    category: c.topic,
    importance: /^[1-5]$/.test(f.importance ?? "") ? Number(f.importance) : null,
    serial: c.order,
    // Same keys the other card screens read (meaning, example) so a card is
    // legible everywhere; `rich` carries every field for the full card.
    details: { meaning: f.meaning, example: f.example_1 ?? "", body: "", audit: "", richType: c.type, rich: f } satisfies Prisma.InputJsonObject,
  };
}

/// JSON with keys in a fixed order. Postgres jsonb does not keep key order, so a
/// plain JSON.stringify would call every stored card "changed".
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

export async function importDeck(
  adminId: string,
  cards: ParsedCard[],
  meta: { title: string; description: string; tags: string[] },
): Promise<ImportResult> {
  const codes = cards.map((c) => c.id);
  let deck = await prisma.deck.findFirst({ where: { ownerId: adminId, title: meta.title }, select: { id: true } });

  // An ID already used by another deck's card (or a built-in word) is a clash,
  // not an update: refusing keeps one deck's upload from rewriting another's.
  const taken = await prisma.word.findMany({
    where: { code: { in: codes } },
    select: { code: true, deckId: true, text: true, category: true, importance: true, serial: true, details: true },
  });
  const clash = taken.filter((t) => !deck || t.deckId !== deck.id).map((t) => t.code);
  if (clash.length) {
    return { error: `${clash.length} card ID${clash.length === 1 ? " is" : "s are"} already used elsewhere (${clash.slice(0, 5).join(", ")}). Give those cards new IDs in the sheet, then upload again.` };
  }

  if (!deck) {
    deck = await prisma.deck.create({
      data: {
        ownerId: adminId,
        title: meta.title,
        description: meta.description || null,
        tags: meta.tags,
        // Published straight away: the admin who uploads is the reviewer.
        visibility: "PUBLIC",
        status: "APPROVED",
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      select: { id: true },
    });
  } else {
    await prisma.deck.update({ where: { id: deck.id }, data: { description: meta.description || null, tags: meta.tags } });
  }

  const stored = new Map(taken.map((t) => [t.code, t]));
  const fresh = cards.filter((c) => !stored.has(c.id));
  // Only rows whose content actually differs are written again, so re-running
  // an import (or resuming one that stopped) costs one read, not a write per card.
  const changed = cards.filter((c) => {
    const row = stored.get(c.id);
    // Through JSON first so keys holding undefined vanish, as they do once stored.
    return row && stable(JSON.parse(JSON.stringify(wordData(c)))) !== stable({ text: row.text, category: row.category, importance: row.importance, serial: row.serial, details: row.details });
  });

  // New cards go in one statement per 100. The live pool has connection_limit=1
  // and each round trip to it is slow, so a write per card took over a second
  // each and ran a 21-deck import past the 15-minute CI limit. skipDuplicates
  // makes a resumed run harmless.
  for (let i = 0; i < fresh.length; i += 100) {
    await prisma.word.createMany({
      data: fresh.slice(i, i + 100).map((c) => ({ ...wordData(c), code: c.id, kind: "WORD" as const, deckId: deck.id, ownerId: adminId })),
      skipDuplicates: true,
    });
  }
  // Changed cards one at a time and outside any transaction: parallel writes
  // only queue for the single connection and time out (P2024), and a long
  // transaction would hit the pooler's timeout. Updating by code keeps the
  // row's id, so students' review progress stays attached.
  for (const c of changed) {
    await prisma.word.update({ where: { code: c.id }, data: wordData(c) });
  }
  const created = fresh.length;
  const updated = changed.length;
  await logAdmin(adminId, "Imported flashcards from Excel", "deck", deck.id, { title: meta.title, created, updated });
  return { ok: true, deckId: deck.id, created, updated };
}
