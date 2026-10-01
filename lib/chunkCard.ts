// Owns reading a chunk's `details` (from content/chunk-library/chunks.json,
// and grammar.json for the Grammar tab, which uses the same card) into typed
// pieces the card shows, the chunk-type filter's labels, and building a
// gap-fill from the card's own data.
//
// Like lib/wordCard.ts it never throws on odd data: the sheet was written by
// people, and a field that does not parse is simply not shown.
//
// It deliberately has no database imports, so both the server page and the
// client card can use it.

export type Bilingual = { dev: string | null; roman: string | null };

export type ChunkDetails = {
  sheet_id?: string;
  group?: string | null;
  topic?: string | null;
  slot?: string | null;
  when?: string | null;
  example?: string | null;
  hindi?: Bilingual | null;
  hindi_example?: Bilingual | null;
  watch_out?: { wrong: string | null; right?: string | null; why: string | null; tip: string | null } | null;
  note?: string | null;
  gap?: { q: string | null; a: string | null } | null;
  path_a?: { n: number; stage: string | null } | null;
  path_b?: { n: number; stage: string | null } | null;
  preposition?: string | null;
  related?: string | null;
  phase?: string | null;
  merged_from?: string | null;
  was_core?: boolean;
  drafted?: string[];
  // Drafted card fields (content/chunk-library/tools/rich_fields.py).
  ipa?: string | null;
  linking?: string | null;
  hi_pron?: string | null;
  stress?: string | null;
  register?: string | null;
  pron_tip?: string | null;
  not_when?: string | null;
  memory?: string | null;
  simple?: string | null;
  more_examples?: string[];
  pattern?: string | null;
  forms?: string | null;
  similar?: string | null;
  dont_say?: string | null;
  reply?: string | null;
  reply_wrong?: string[];
  confusing?: { pair: string | null; diff: string | null } | null;
  where?: string[];
  tone?: string | null;
  real_life?: { everyday: string | null; work: string | null; casual: string | null } | null;
  conversation?: string[];
  speaking_task?: string | null;
};

export function chunkDetailsOf(json: unknown): ChunkDetails {
  return json && typeof json === "object" ? (json as ChunkDetails) : {};
}

/// The type filter on the Chunk tab. `value` is what `Word.category` holds.
export const CHUNK_TYPES = [
  { value: "frames", label: "Frames" },
  { value: "prepositions", label: "Prepositions" },
  { value: "collocations", label: "Collocations" },
  { value: "utterances", label: "Utterances" },
  { value: "polywords", label: "Polywords" },
] as const;

export type ChunkType = (typeof CHUNK_TYPES)[number]["value"];

export function isChunkType(v: unknown): v is ChunkType {
  return CHUNK_TYPES.some((t) => t.value === v);
}

export function chunkTypeLabel(v: string | null | undefined): string {
  return CHUNK_TYPES.find((t) => t.value === v)?.label ?? "Chunk";
}

/// The chunk without its placeholders ("___", "…", "(someone)"): what
/// is actually said, for the speak button and for gap-fill matching.
export function sayable(text: string): string {
  return text
    .replace(/\([^)]*\)/g, " ")
    .replace(/_{2,}|…|\.\.\./g, " ")
    .replace(/\+\s*-?ing/gi, " ")
    .replace(/[?!.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/// A fill-in-the-blank for this chunk: the sheet's own question when it has
/// one, otherwise the example with the chunk blanked out — but only when the
/// chunk appears in the example exactly. Inflected uses ("making noise" for
/// "make noise") are skipped rather than guessed.
export function chunkGap(text: string, d: ChunkDetails): { prompt: string; answer: string } | null {
  if (d.gap?.q && d.gap.a) return { prompt: d.gap.q, answer: d.gap.a };
  const example = d.example ?? "";
  const phrase = sayable(text);
  if (!phrase || phrase.split(" ").length > 6 || !example) return null;
  // Whole words only: "at" must not match inside "that".
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`(^|[^\\p{L}'])(${escaped})(?=$|[^\\p{L}'])`, "iu").exec(example);
  if (!m) return null;
  const at = m.index + m[1].length;
  const answer = m[2];
  return { prompt: `${example.slice(0, at)}______${example.slice(at + answer.length)}`, answer };
}

/// The one-line meaning used in lists, search results and teacher screens.
export function chunkGloss(d: ChunkDetails): string {
  return d.hindi?.roman ?? d.example ?? "";
}

/// "Word", "Chunk" or "Grammar", for screens that label a flashcard recording.
export function cardNoun(kind: string | null | undefined): "Word" | "Chunk" | "Grammar" {
  return kind === "CHUNK" ? "Chunk" : kind === "GRAMMAR" ? "Grammar" : "Word";
}
