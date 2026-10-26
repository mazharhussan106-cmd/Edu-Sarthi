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
import { AiError } from "@/lib/aiTranscribe";

const MODEL = process.env.AI_CARDS_MODEL || "claude-sonnet-5-5";

/// Small on purpose. Output is generated at tens of tokens a second, so twenty
/// full cards can run past a serverless time limit; ten finish well inside it,
/// and the learner can ask again for the next chapter.
export const MAX_CARDS_PER_REQUEST = 10;
const MAX_QUESTIONS = 6;

/// Question ids whose answers are remembered and offered again next time. The
/// model is told to use these ids for these topics, so an answer given once
/// can be matched to the same question later whatever the material is.
export const STABLE_IDS = ["language", "level", "purpose", "sections", "style", "count"] as const;

export type SourceInput =
  | { type: "text"; text: string }
  | { type: "pdf"; data: string }
  | { type: "image"; mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string };

export type Question = {
  id: string;
  text: string;
  type: "choice" | "multi" | "number" | "text";
  options: string[];
  suggested: string[];
};
export type Remembered = Record<string, string[]>;
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

const isCount = (v: string) => /^\d{1,3}$/.test(v) && Number(v) >= 1 && Number(v) <= MAX_CARDS_PER_REQUEST;

/// Whether `values` is an acceptable answer to `q`, and if so the cleaned form.
function fit(q: Pick<Question, "type" | "options">, values: string[] | undefined): string[] {
  const v = (values ?? []).map((s) => s.trim()).filter(Boolean);
  if (q.type === "choice") return v[0] && q.options.includes(v[0]) ? [v[0]] : [];
  if (q.type === "multi") return v.filter((s) => q.options.includes(s));
  if (q.type === "number") return v[0] && isCount(v[0]) ? [v[0]] : [];
  return [];
}

/// Cleans the model's questions and applies what the learner chose last time.
/// A remembered answer wins over the model's guess: it is the learner's own
/// word, and offering it back is the point of remembering. The count question
/// is forced, because making cards needs a number and the model may forget it.
export function normaliseQuestions(raw: z.infer<typeof questionsModel>["questions"], remembered: Remembered): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const r of raw) {
    const id = r.id.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30);
    const text = r.text.trim().slice(0, 200);
    if (!id || !text || seen.has(id)) continue;
    const options = [...new Set(r.options.map((o) => o.trim().slice(0, 60)).filter(Boolean))].slice(0, 8);
    // A pick-one question with fewer than two choices is a text question.
    const type = (r.type === "choice" || r.type === "multi") && options.length < 2 ? "text" : r.type;
    const q: Question = { id, text, type, options: type === "choice" || type === "multi" ? options : [], suggested: [] };
    q.suggested = fit(q, remembered[id]);
    if (!q.suggested.length) q.suggested = fit(q, r.suggested);
    seen.add(id);
    out.push(q);
  }
  const limited = out.filter((q) => q.id !== "count").slice(0, MAX_QUESTIONS - 1);
  const count: Question = { id: "count", text: `How many cards should I make? (up to ${MAX_CARDS_PER_REQUEST} at a time)`, type: "number", options: [], suggested: [] };
  count.suggested = fit(count, remembered.count).length ? fit(count, remembered.count) : [String(MAX_CARDS_PER_REQUEST)];
  return [...limited, count];
}

/// What to remember from a finished set of answers: only the stable ids, and
/// only answers that are valid for their question.
export function rememberAnswers(questions: Question[], answers: Record<string, string[]>, previous: Remembered): Remembered {
  const next: Remembered = { ...previous };
  for (const q of questions) {
    if (!(STABLE_IDS as readonly string[]).includes(q.id)) continue;
    const kept = fit(q, answers[q.id]);
    if (kept.length) next[q.id] = kept;
  }
  return next;
}

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
  let res;
  try {
    res = await ai.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      // Low: choosing a few good questions needs little reasoning, and this
      // call runs before the learner has made a single card.
      output_config: { effort: "low", format: zodOutputFormat(questionsModel) },
      system: ASK_SYSTEM,
      messages: [{ role: "user", content: blocks(input, tail) }],
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
  let res;
  try {
    res = await ai.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium", format: zodOutputFormat(cardsModel) },
      system: MAKE_SYSTEM,
      messages: [{ role: "user", content: blocks(input, tail) }],
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
      if (!ok.success || seen.has(key) || total >= count) {
        dropped += 1;
        continue;
      }
      seen.add(key);
      cards.push(ok.data);
      total += 1;
    }
    if (cards.length) chapters.push({ title, cards });
  }
  if (!total) throw new AiError("The AI did not make any usable cards. Try again with a clearer request or a different source.");
  return { chapters, cardCount: total, dropped, note: res.parsed_output.note.trim().slice(0, 300), tokens: tokens(res.usage) };
}
