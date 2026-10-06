// Owns saving parsed Excel cards as a published deck owned by the admin who
// uploaded them. Cards are matched by their ID (stored as Word.code): an ID
// that exists is updated, a new ID is added, nothing is ever deleted — so a
// student's review progress, which hangs off the card row, survives a re-upload.
//
// The upload may be re-run safely if it stops halfway; every write is an upsert.
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

export async function importDeck(
  adminId: string,
  cards: ParsedCard[],
  meta: { title: string; description: string; tags: string[] },
): Promise<ImportResult> {
  const codes = cards.map((c) => c.id);
  let deck = await prisma.deck.findFirst({ where: { ownerId: adminId, title: meta.title }, select: { id: true } });

  // An ID already used by another deck's card (or a built-in word) is a clash,
  // not an update: refusing keeps one deck's upload from rewriting another's.
  const taken = await prisma.word.findMany({ where: { code: { in: codes } }, select: { code: true, deckId: true } });
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

  const existing = new Set(taken.map((t) => t.code));
  let created = 0;
  let updated = 0;
  // In small batches outside any transaction: 200+ upserts in one would hit the
  // pooler's transaction timeout, and each upsert is safe to repeat.
  for (let i = 0; i < cards.length; i += 20) {
    await Promise.all(
      cards.slice(i, i + 20).map((c) => {
        const d = wordData(c);
        existing.has(c.id) ? updated++ : created++;
        return prisma.word.upsert({
          where: { code: c.id },
          create: { ...d, code: c.id, kind: "WORD", deckId: deck!.id, ownerId: adminId },
          update: d,
        });
      }),
    );
  }
  await logAdmin(adminId, "Imported flashcards from Excel", "deck", deck.id, { title: meta.title, created, updated });
  return { ok: true, deckId: deck.id, created, updated };
}
