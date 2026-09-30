// Owns reading a chunk's `details` (from content/chunk-library/chunks.json)
// into typed pieces the chunk card shows, the chunk-type filter's labels,
// and building a gap-fill from the chunk's own data.
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
  watch_out?: { wrong: string | null; why: string | null; tip: string | null } | null;
  note?: string | null;
  gap?: { q: string | null; a: string | null } | null;
  path_a?: { n: number; stage: string | null } | null;
  path_b?: { n: number; stage: string | null } | null;
  preposition?: string | null;
  related?: string | null;
  phase?: string | null;
  merged_from?: string | null;
  drafted?: string[];
};

export function chunkDetailsOf(json: unknown): ChunkDetails {
  return json && typeof json === "object" ? (json as ChunkDetails) : {};
}

/// The type filter on the Chunk tab. `value` is what `Word.category` holds.
export const CHUNK_TYPES = [
  { value: "core", label: "Core 220" },
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

export type ChunkPath = "A" | "B";

/// The two learning orders, described from the sheet's own stage names.
export const CHUNK_PATHS: { value: ChunkPath; title: string; steps: string[] }[] = [
  {
    value: "A",
    title: "Path A · Level by level",
    steps: ["Survival chunks", "Slot stems", "Collocations & fillers", "Connectors", "Idioms"],
  },
  {
    value: "B",
    title: "Path B · Stage by stage",
    steps: ["Unfreeze", "Fix errors people notice", "Skim the basics", "Collocations & natural speech", "Connectors", "Idioms"],
  },
];

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

/// "Word" or "Chunk", for screens that label a flashcard recording.
export function cardNoun(kind: string | null | undefined): "Word" | "Chunk" {
  return kind === "CHUNK" ? "Chunk" : "Word";
}
