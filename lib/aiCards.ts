// Owns the two model calls behind the AI card maker: asking the learner a few
// questions about what they want, then making the cards from the answers. It
// also owns the rules those answers and cards must satisfy before anything
// reaches the screen.
//
// It deliberately does NOT check who is calling, count the free allowance,
// save anything, or read stored files; the routes and lib/aiCardLimits do.
// Source files arrive already as base64 or text. Nothing here touches the
// database, so every rule below can be tested with a fake model.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { ASK_SYSTEM, MAKE_SYSTEM } from "@/lib/aiCardPrompts";
import { MAX_CARDS_PER_REQUEST } from "@/lib/aiCardSchemas";
import { STABLE_IDS, normaliseQuestions, rememberAnswers, type Question, type Remembered } from "@/lib/aiCardQuestions";
import { AiError } from "@/lib/aiTranscribe";

const MODEL = process.env.AI_CARDS_MODEL || "claude-sonnet-5-5";

// Re-exported so server code keeps one import; it lives in aiCardSchemas so the
// browser can read it without bundling the model SDK.
export { MAX_CARDS_PER_REQUEST, STABLE_IDS, normaliseQuestions, rememberAnswers };
export type { Question, Remembered };

export type SourceInput =
  | { type: "text"; text: string }
  | { type: "pdf"; data: string }
  | { type: "image"; mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string };

export type Answer = { question: string; answer: string };
export type CardDraft = { front: string; back: string; example: string; body: string };
export type Chapter = { title: string; cards: CardDraft[] };
export type Material = { request: string; sources: SourceInput[] };

const questionsModel = z.object({
  kind: z.enum(["word", "sentence", "topic", "chapter", "concept", "book", "other"]),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(["choice", "multi", "number", "text"]),
      options: z.array(z.string()),
      suggested: z.array(z.string()),
    }),
  ),
});

const cardsModel = z.object({
  chapters: z.array(
    z.object({
      title: z.string(),
      cards: z.array(z.object({ front: z.string(), back: z.string(), example: z.string(), body: z.string() })),
    }),
  ),
  note: z.string(),
});

// The same limits as a hand-made card (lib/deckSchemas), so an AI card can be
// saved through the normal route without being refused.
const strictCard = z.object({
  front: z.string().trim().min(1).max(200),
  back: z.string().trim().min(1).max(500),
  example: z.string().trim().max(300),
  body: z.string().trim().max(2000),
});

function blocks(m: Material, tail: string): Anthropic.ContentBlockParam[] {
  const out: Anthropic.ContentBlockParam[] = [];
  m.sources.forEach((s, i) => {
    if (s.type === "pdf") out.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: s.data } });
    else if (s.type === "image") out.push({ type: "image", source: { type: "base64", media_type: s.mediaType, data: s.data } });
    else out.push({ type: "text", text: `<source number="${i + 1}">\n${s.text}\n</source>` });
  });
  // Files and images go first and the written instruction last, which is the
  // order the model reads them best in.
  out.push({ type: "text", text: tail });
  return out;
}

function failure(err: unknown): AiError {
  if (err instanceof Anthropic.RateLimitError) return new AiError("The AI service is busy or its budget is used up. Try again in a few minutes.");
  if (err instanceof Anthropic.AuthenticationError) return new AiError("The AI key was not accepted. Tell an admin, then try again.");
  if (err instanceof Anthropic.APIConnectionError) return new AiError("The AI service did not answer in time. Try again, or use less source material.");
  return new AiError("The AI could not do that this time. Try again, or change what you asked for.");
}

function tokens(u: { input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null }) {
  return u.input_tokens + u.output_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
}

/// Most input tokens one request may use. A PDF page costs roughly 1,500 to
/// 3,000, so this is a few dozen pages, which is plenty for a chapter and keeps
/// one request from costing more than the cards are worth.
export const MAX_SOURCE_TOKENS = 60_000;

/// Counts the request before it is made, when it carries a file. Counting is
/// free, and it is the only way to know what a PDF will cost: its size in bytes
/// says almost nothing about its pages. Text-only requests are already bounded
/// by the pasted-text limit, so they skip the extra call.
async function checkSize(ai: Anthropic, system: string, content: Anthropic.ContentBlockParam[], m: Material) {
  if (!m.sources.some((s) => s.type !== "text")) return;
  let n: number;
  try {
    n = (await ai.messages.countTokens({ model: MODEL, system, messages: [{ role: "user", content }] })).input_tokens;
  } catch (err) {
    throw failure(err);
  }
  if (n > MAX_SOURCE_TOKENS) {
    throw new AiError("Your files are too long to read in one go. Remove a file, or use fewer pages, then try again.");
  }
}

function needKey(client?: Anthropic) {
  if (!client && !process.env.ANTHROPIC_API_KEY) {
    throw new AiError("The AI card maker is not switched on yet. Ask an admin to add the Anthropic key.");
  }
}

export async function askQuestions(
  input: Material & { remembered: Remembered },
  client?: Anthropic,
): Promise<{ kind: string; questions: Question[]; tokens: number }> {
  needKey(client);
  const ai = client ?? new Anthropic({ timeout: 40_000, maxRetries: 1 });
  const tail = `<request>\n${input.request}\n</request>\n\nThe learner's answers last time (use them as suggestions where they still fit):\n${JSON.stringify(input.remembered)}`;
  const content = blocks(input, tail);
  await checkSize(ai, ASK_SYSTEM, content, input);
  let res;
  try {
    res = await ai.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      // Low: choosing a few good questions needs little reasoning, and this
      // call runs before the learner has made a single card.
      output_config: { effort: "low", format: zodOutputFormat(questionsModel) },
      system: ASK_SYSTEM,
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    throw failure(err);
  }
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new AiError("The AI could not work with that request. Change what you asked for and try again.");
  const questions = normaliseQuestions(res.parsed_output.questions, input.remembered);
  return { kind: res.parsed_output.kind, questions, tokens: tokens(res.usage) };
}

export async function makeCards(
  input: Material & { answers: Answer[]; count: number },
  client?: Anthropic,
): Promise<{ chapters: Chapter[]; cardCount: number; dropped: number; note: string; tokens: number }> {
  needKey(client);
  const count = Math.min(Math.max(Math.floor(input.count), 1), MAX_CARDS_PER_REQUEST);
  const ai = client ?? new Anthropic({ timeout: 240_000, maxRetries: 0 });
  const answers = input.answers.map((a) => `- ${a.question} ${a.answer}`).join("\n");
  const tail = `<request>\n${input.request}\n</request>\n\n<answers>\n${answers}\n</answers>\n\nMake at most ${count} cards.`;
  const content = blocks(input, tail);
  await checkSize(ai, MAKE_SYSTEM, content, input);
  let res;
  try {
    res = await ai.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium", format: zodOutputFormat(cardsModel) },
      system: MAKE_SYSTEM,
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    throw failure(err);
  }
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new AiError("The AI could not make cards from that. Change what you asked for and try again.");

  // A card over the limits is dropped rather than cut: a sentence chopped at
  // the character limit is worse than a missing card, and the learner is told.
  const seen = new Set<string>();
  let dropped = 0;
  let total = 0;
  const chapters: Chapter[] = [];
  for (const c of res.parsed_output.chapters) {
    const title = c.title.trim().slice(0, 60) || "Cards";
    const cards: CardDraft[] = [];
    for (const raw of c.cards) {
      const ok = strictCard.safeParse(raw);
      const key = ok.success ? ok.data.front.toLowerCase() : "";
      if (!ok.success || seen.has(key)) {
        dropped += 1;
        continue;
      }
      // Extra cards beyond the number asked for are not "dropped": the person
      // never expected them, so counting them would report a loss that is not one.
      if (total >= count) continue;
      seen.add(key);
      cards.push(ok.data);
      total += 1;
    }
    if (cards.length) chapters.push({ title, cards });
  }
  if (!total) throw new AiError("The AI did not make any usable cards. Try again with a clearer request or a different source.");
  return { chapters, cardCount: total, dropped, note: res.parsed_output.note.trim().slice(0, 300), tokens: tokens(res.usage) };
}
