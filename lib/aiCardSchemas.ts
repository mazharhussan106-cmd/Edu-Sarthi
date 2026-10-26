// Owns the shape of what the browser may send to the AI card routes. The same
// schemas can run in the form for instant feedback; the routes enforce them,
// because client checks are assumed bypassed.
//
// It deliberately holds no model, database or storage code. A source is either
// pasted text or the id of a file already uploaded through
// /api/decks/ai-cards/sources; the file itself never travels in these requests.

import { z } from "zod";

import { deckFields } from "@/lib/deckSchemas";

export const MAX_SOURCE_TEXT = 30_000;
export const MAX_SOURCES = 5;

/// Small on purpose. Output is generated at tens of tokens a second, so twenty
/// full cards can run past a serverless time limit; ten finish well inside it,
/// and the learner can ask again for the next chapter.
export const MAX_CARDS_PER_REQUEST = 10;

const textSource = z.object({
  type: z.literal("text"),
  text: z.string().trim().min(1, "The pasted text is empty").max(MAX_SOURCE_TEXT, `Keep each pasted text under ${MAX_SOURCE_TEXT.toLocaleString("en-IN")} characters, or split it into two`),
});
const fileSource = z.object({ type: z.literal("file"), id: z.string().min(1).max(40) });

export const sourceSchema = z.discriminatedUnion("type", [textSource, fileSource]);

export const requestSchema = z.object({
  request: z.string().trim().min(3, "Tell the AI what you want cards for").max(2000, "Keep the request under 2000 characters"),
  sources: z.array(sourceSchema).max(MAX_SOURCES, `Add up to ${MAX_SOURCES} sources`).default([]),
});

// A question comes back from the browser along with the answers, because the
// server keeps no state between the two steps. It only shapes the person's own
// prompt and their own remembered answers, so it is bounded, not trusted.
const questionSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]{1,30}$/),
  text: z.string().trim().min(1).max(200),
  type: z.enum(["choice", "multi", "number", "text"]),
  options: z.array(z.string().max(60)).max(8),
  suggested: z.array(z.string().max(60)).max(8),
});

export const makeSchema = requestSchema.extend({
  questions: z.array(questionSchema).min(1).max(6),
  answers: z.record(z.string(), z.array(z.string().trim().max(500)).max(8)),
});

/// A file to be added: only what the server needs to decide whether to accept
/// it. The bytes go straight to storage, not through the app.
export const sourceFileSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive("That file appears to be empty"),
});

export const removeSourceSchema = z.object({ id: z.string().min(1).max(40) });

/// One AI-made card as the person left it after reading and editing. The same
/// limits as a hand-made card (lib/deckSchemas), plus the chapter it sits in.
export const aiCardSchema = z.object({
  front: z.string().trim().min(1, "Every card needs a front").max(200, "Keep each front under 200 characters"),
  back: z.string().trim().min(1, "Every card needs a back").max(500, "Keep each back under 500 characters"),
  example: z.string().trim().max(300, "Keep each example under 300 characters").default(""),
  body: z.string().trim().max(2000, "Keep each card's notes under 2000 characters").default(""),
  chapter: z.string().trim().max(60, "Keep chapter names under 60 characters").default(""),
});

export const addAiCardsSchema = z.object({
  cards: z.array(aiCardSchema).min(1, "Choose at least one card to add").max(20, "Add up to 20 cards at a time"),
});

/// A new deck made from the AI's cards in one go: the deck's name and the cards
/// the person kept. One request, so a deck is never left empty by a half-done add.
export const newAiDeckSchema = z.object({
  title: deckFields.title,
  cards: addAiCardsSchema.shape.cards,
});
