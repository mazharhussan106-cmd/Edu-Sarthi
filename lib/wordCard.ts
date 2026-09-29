// Owns turning a Word row's `details` (the WordMaster sheet's columns) into
// the typed pieces the flashcard shows: MCQ options, "sentence → answer"
// pairs, conversation lines.
//
// The sheet was written by people, so every parser here falls back to showing
// the raw text rather than throwing when a cell does not match the pattern.

export type WordDetails = Record<string, string | undefined>;

export function detailsOf(json: unknown): WordDetails {
  return json && typeof json === "object" ? (json as WordDetails) : {};
}

/// "A) yes  B) yeah  C) Yes, I can.  D) ya" → [{key:"A", text:"yes"}, …]
export function parseOptions(raw: string | undefined): { key: string; text: string }[] {
  if (!raw) return [];
  const parts = raw.split(/(?:^|\s+)([A-F])\)\s*/).filter((p) => p !== "");
  const out: { key: string; text: string }[] = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    if (/^[A-F]$/.test(parts[i])) out.push({ key: parts[i], text: parts[i + 1].trim() });
  }
  return out;
}

/// "Question text → answer" → { prompt, answer }. No arrow: prompt only.
export function splitArrow(raw: string | undefined): { prompt: string; answer: string | null } {
  if (!raw) return { prompt: "", answer: null };
  const i = raw.lastIndexOf("→");
  return i < 0 ? { prompt: raw, answer: null } : { prompt: raw.slice(0, i).trim(), answer: raw.slice(i + 1).trim() };
}

/// Conversation cells use line breaks or " / " between turns.
export function lines(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(/\n|\s\/\s/).map((l) => l.trim()).filter(Boolean);
}

/// Comma-separated list cells: "delay, postpone, put off".
export function list(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
}

/// Forgiving comparison for typed answers: case, punctuation and extra spaces
/// do not count against the student.
export function sameAnswer(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, " ").replace(/\s+/g, " ").trim();
  return norm(a) === norm(b);
}
