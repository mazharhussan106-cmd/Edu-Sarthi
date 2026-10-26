// Owns turning the cards a person chose from the AI card maker into the rows a
// deck stores: one place, so adding to an existing deck and starting a new deck
// from AI cards can never disagree about what an AI card looks like in the
// database.
//
// It deliberately does NOT write anything or check limits. The routes do that
// under the per-user lock; this only shapes the data. The chapter goes in
// `category` (the deck index is built from it) and every row is marked
// `aiAssisted` here, on the server, never taken from the browser.

import type { z } from "zod";

import type { aiCardSchema } from "@/lib/aiCardSchemas";
import { newCardCode } from "@/lib/decks";

export function aiCardRows(userId: string, deckId: string, firstSerial: number, cards: z.infer<typeof aiCardSchema>[]) {
  return cards.map((c, i) => ({
    text: c.front,
    code: newCardCode(),
    serial: firstSerial + i,
    kind: "WORD" as const,
    deckId,
    ownerId: userId,
    category: c.chapter || null,
    details: { meaning: c.back, example: c.example, body: c.body, audit: "", aiAssisted: true },
  }));
}
