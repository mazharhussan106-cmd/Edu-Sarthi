// Owns the vocabulary of the 56-point flashcard Excel files: which column
// heading means which field, and which fields every card type must have.
//
// Two layouts exist in the wild — the older one (a single heading row, labels
// like "Hinglish Samjhao") and the v2 one (a band row above the headings,
// labels like "Simple explanation (Hinglish)"). Both map onto the same field
// keys, so a card looks the same whichever file it came from.
//
// It deliberately holds no parsing or database code (lib/xlsxCards) and no
// rendering (components/decks/RichCard).

export type CardType = "code56" | "word56" | "topic56";

/// Heading text (lower-cased, trimmed) → field key.
const LABELS: Record<string, string> = {
  id: "id", topic: "topic", chapter: "topic", level: "level", "study order": "order", source: "source",
  concept: "term", "term / topic": "term", "word / phrase": "term",
  "recall cue": "cue", "read aloud": "pronunciation", pronunciation: "pronunciation",
  "syllables / stress": "syllables", "part of speech": "part_of_speech", register: "register",
  type: "kind", "how often used": "frequency", frequency: "frequency", "importance (1-5)": "importance",
  "origin / why it exists": "origin", "pro tip": "pro_tip", "typing hint": "typing_hint",
  "memory story": "memory_story", "picture it": "visual", "visual picture": "visual", "emotion hook": "emotion",
  category: "category",
  "meaning (short)": "meaning", "meaning (simple)": "meaning", "definition (simple)": "meaning",
  "meaning in learner's language": "native_meaning", "hindi meaning": "native_meaning",
  code: "code", output: "output", explanation: "explanation", "how / why it works": "explanation",
  "simple explanation (hinglish)": "simple_explain", "hinglish samjhao": "simple_explain",
  "real-life analogy": "analogy", "syntax pattern": "syntax", anatomy: "anatomy", "formula / rule": "formula_rule",
  "example 1": "example_1", "example 2": "example_2", "example 3": "example_3", variation: "variation",
  "grammar pattern": "pattern", collocations: "collocations", similar: "synonyms", opposite: "antonyms",
  "used with": "used_with", "related concepts": "related", alternatives: "alternatives",
  "family / group": "word_family", "word family": "word_family", "where it is used": "where_used",
  "mini conversation": "mini_conversation",
  "common mistake": "misconception", misunderstanding: "misconception",
  "commonly confused with": "confused_with", "don't confuse with": "confused_with",
  "avoid / don't": "avoid", avoid: "avoid",
  "wrong code": "wrong_code", "right code": "right_code", "memory trick": "memory_trick",
  "real life: project / work": "real_project", "real-life: project": "real_project",
  "real life: interview / exam": "real_interview", "real-life: interview": "real_interview",
  "real life: daily life": "real_daily", "real-life: daily life": "real_daily",
  "mcq question": "mcq_question", "mcq options": "mcq_options", "mcq answer": "mcq_answer", "why that answer": "mcq_why",
  "fill the blank": "fill_blank", "fill in the blank": "fill_blank", "fill answer": "fill_answer",
  "task in learner's language": "hindi_to_task", "hindi → code task": "hindi_to_task", "say it in the target language": "hindi_to_task",
  "task answer": "task_answer", "hindi → code answer": "task_answer", "translation answer": "task_answer",
  "write your own": "own_task", "find & fix": "find_fix",
  "practice question": "practice_question", "practice answer": "practice_answer",
  "apply it": "apply", "explain it yourself": "explain_task",
  "quick recall (reverse)": "quick_recall",
};

export function fieldKey(heading: string): string | null {
  return LABELS[heading.trim().toLowerCase()] ?? null;
}

/// Fields that must be filled for a card to be worth showing. Anything else is
/// optional: a missing "Pro tip" is a thinner card, a missing MCQ is a broken one.
export const REQUIRED: Record<CardType, string[]> = {
  code56: ["term", "meaning", "code", "explanation", "example_1", "misconception", "mcq_question", "mcq_options", "mcq_answer", "practice_question", "practice_answer"],
  word56: ["term", "meaning", "example_1", "misconception", "mcq_question", "mcq_options", "mcq_answer"],
  topic56: ["term", "meaning", "explanation", "example_1", "misconception", "mcq_question", "mcq_options", "mcq_answer"],
};

/// Which card type a worksheet holds, from its name and the headings it has.
export function detectType(sheetName: string, keys: Set<string>): CardType | null {
  const n = sheetName.toLowerCase();
  if (!keys.has("id") || !keys.has("term") || !keys.has("mcq_question")) return null;
  if (n.includes("word")) return "word56";
  if (n.includes("topic")) return "topic56";
  if (n.includes("code") || keys.has("code")) return "code56";
  return "topic56";
}
