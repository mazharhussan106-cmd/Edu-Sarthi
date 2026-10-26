// Owns the rules for the questions the AI card maker asks: cleaning what the
// model wrote, offering the person's last answers back as defaults, forcing the
// "how many cards" question, and deciding which answers are worth remembering.
//
// It deliberately does NOT call the model or touch the database (lib/aiCards
// and lib/aiCardPrefs do). It is pure, so every rule here is tested with plain
// data and no fake server.

import { MAX_CARDS_PER_REQUEST } from "@/lib/aiCardSchemas";

const MAX_QUESTIONS = 6;

/// Question ids whose answers are remembered and offered again next time. The
/// model is told to use these ids for these topics, so an answer given once
/// can be matched to the same question later whatever the material is.
export const STABLE_IDS = ["language", "level", "purpose", "sections", "style", "count"] as const;

export type Question = {
  id: string;
  text: string;
  type: "choice" | "multi" | "number" | "text";
  options: string[];
  suggested: string[];
};
export type Remembered = Record<string, string[]>;
/// A question exactly as the model wrote it, before any clean-up.
export type RawQuestion = { id: string; text: string; type: "choice" | "multi" | "number" | "text"; options: string[]; suggested: string[] };

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
export function normaliseQuestions(raw: RawQuestion[], remembered: Remembered): Question[] {
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
