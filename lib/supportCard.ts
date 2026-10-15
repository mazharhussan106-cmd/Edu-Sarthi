// Owns reading a customer-support card's `details` (from
// content/support-cards/support.json, loaded by prisma/import-support.ts) into
// typed pieces the card shows, the Support tab's channel and level filters,
// and the small parsers for the sheet's packed fields (MCQ options, the
// " · " lists, the mini conversation).
//
// Like lib/chunkCard.ts it never throws on odd data: a field that does not
// parse is simply not shown. It deliberately has no database imports, so both
// the server page and the client card can use it.

/// Every field of the 56 except the ones kept as real columns (id → code,
/// sentence → text, channel → category, level → partOfSpeech, cefr,
/// importance). Keys are the workbook's own, so a re-export needs no mapping.
export type SupportDetails = Partial<
  Record<
    | "kind" | "call_stage" | "speaker" | "situation" | "recall_cue" | "stress" | "linking" | "intonation"
    | "indian_pron_tip" | "register" | "tone" | "customer_emotion" | "memory_hook"
    | "hindi_meaning" | "hindi_roman" | "simple_meaning" | "why_it_works" | "key_chunk" | "grammar_pattern"
    | "grammar_note" | "tone_note" | "watch_out" | "dont_say" | "positive_swap" | "alt_1" | "alt_2"
    | "more_formal" | "ask_next" | "replies_you_may_hear" | "if_customer_pushes" | "cultural_note"
    | "channel_note" | "when_not_to_use" | "mini_conversation" | "source_rule"
    | "fill_blank" | "fill_answer" | "mcq_question" | "mcq_options" | "mcq_answer" | "mcq_why"
    | "reorder_task" | "reorder_answer" | "hindi_to_english" | "hindi_to_english_answer"
    | "whats_next_customer" | "whats_next_reply" | "role_play" | "record_task" | "self_check",
    string
  >
>;

export function supportDetailsOf(json: unknown): SupportDetails {
  return json && typeof json === "object" ? (json as SupportDetails) : {};
}

/// The Support tab's two filters. `value` is what the URL carries; the
/// channel is stored lower-case in `Word.category`, the level as written in
/// the sheet in `Word.partOfSpeech` (both are real columns so they filter).
export const SUPPORT_CHANNELS = [
  { value: "voice", label: "Voice" },
  { value: "chat", label: "Chat" },
  { value: "email", label: "Email" },
] as const;

export const SUPPORT_LEVELS = [
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export type SupportChannel = (typeof SUPPORT_CHANNELS)[number]["value"];
export type SupportLevel = (typeof SUPPORT_LEVELS)[number]["value"];

export function isSupportChannel(v: unknown): v is SupportChannel {
  return SUPPORT_CHANNELS.some((c) => c.value === v);
}

export function isSupportLevel(v: unknown): v is SupportLevel {
  return SUPPORT_LEVELS.some((l) => l.value === v);
}

/// "basic" → "Basic", the form stored in Word.partOfSpeech.
export function levelLabel(v: string | null | undefined): string {
  return SUPPORT_LEVELS.find((l) => l.value === v?.toLowerCase())?.label ?? v ?? "";
}

export function channelLabel(v: string | null | undefined): string {
  return SUPPORT_CHANNELS.find((c) => c.value === v?.toLowerCase())?.label ?? v ?? "";
}

/// The one-line meaning used in lists, search results and teacher screens.
export function supportGloss(d: SupportDetails): string {
  return d.hindi_roman ?? d.simple_meaning ?? "";
}

/// "a · b · c" → ["a", "b", "c"]; empty pieces dropped.
export function dotList(v: string | null | undefined): string[] {
  return (v ?? "").split(" · ").map((s) => s.trim()).filter(Boolean);
}

/// "A) … | B) … | C) … | D) …" → keyed options. Fewer than two parsed means
/// the field is malformed, and the question is not shown at all.
export function mcqOptions(v: string | null | undefined): { key: string; text: string }[] {
  const out = [...(v ?? "").matchAll(/(?:^|\|)\s*([A-D])\)\s*([^|]+)/g)].map((m) => ({ key: m[1], text: m[2].trim() }));
  return out.length >= 2 ? out : [];
}

/// "Customer: … | Agent: …" → turns. A piece with no speaker is kept as the
/// previous speaker's, so a stray "|" inside a line does not lose text.
export function conversation(v: string | null | undefined): { who: string; line: string }[] {
  const turns: { who: string; line: string }[] = [];
  for (const piece of (v ?? "").split(" | ")) {
    const m = /^\s*(Customer|Agent)\s*:\s*(.*)$/.exec(piece);
    if (m) turns.push({ who: m[1], line: m[2].trim() });
    else if (turns.length && piece.trim()) turns[turns.length - 1].line += ` | ${piece.trim()}`;
  }
  return turns;
}

/// "✗ wrong → ✓ right" → its two halves; null when the field is not in that shape.
export function watchOut(v: string | null | undefined): { wrong: string; right: string } | null {
  const m = /✗\s*(.*?)\s*→\s*✓\s*(.*)$/.exec(v ?? "");
  return m ? { wrong: m[1], right: m[2] } : null;
}
