// Owns a manual check of the AI features against the REAL services, run from a
// laptop with your own keys: the AI card maker (text, a PDF or a photo), the
// audio draft audit and the help chatbot. It prints what the model said, how long it took and how
// many tokens it used, which is exactly what a mocked test cannot tell you.
//
// It deliberately does NOT touch the database, storage or any signed-in user:
// no cards are saved, no allowance is counted, nothing is uploaded. It calls the
// same functions the routes call (lib/aiCards, lib/aiTranscribe, lib/aiDraft,
// lib/aiHelp).
// It spends real money on every run, a few cents at most.
//
// Usage (see docs/AI-LIVE-TEST.md):
//   npx tsx --env-file=.env scripts/ai-smoke.ts cards "Class 9 Physics chapter 3, Newton's laws"
//   npx tsx --env-file=.env scripts/ai-smoke.ts pdf path\to\chapter.pdf "Make cards for this chapter"
//   npx tsx --env-file=.env scripts/ai-smoke.ts image path\to\notes.jpg
//   npx tsx --env-file=.env scripts/ai-smoke.ts audio path\to\recording.webm
//   npx tsx --env-file=.env scripts/ai-smoke.ts help "How do I change my email?" ["Follow-up question"]

import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { askQuestions, makeCards, MAX_SOURCE_TOKENS, type Answer, type SourceInput } from "@/lib/aiCards";
import { draftAudit } from "@/lib/aiDraft";
import { askHelp } from "@/lib/aiHelp";
import type { HelpTurn } from "@/lib/aiHelpSchemas";
import { AiError, speechStats, transcribeAudio } from "@/lib/aiTranscribe";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp"> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const AUDIO_TYPES: Record<string, string> = { ".webm": "audio/webm", ".mp4": "audio/mp4", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".mpeg": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav" };

async function timed<T>(label: string, run: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  const out = await run();
  console.log(`   (${label}: ${((performance.now() - t0) / 1000).toFixed(1)} s)`);
  return out;
}

async function readFileChecked(file: string): Promise<Buffer> {
  const size = (await stat(file)).size;
  // The same ceiling the app enforces; a bigger file would fail in the app too.
  if (size > MAX_FILE_BYTES) throw new AiError(`${file} is ${(size / 1024 / 1024).toFixed(1)} MB; the app accepts up to 10 MB.`);
  return readFile(file);
}

async function runCards(request: string, sources: SourceInput[]) {
  console.log(`\nRequest: ${request}\nSources: ${sources.length ? sources.map((s) => s.type).join(", ") : "none"}\n`);

  console.log("1. The AI's questions");
  const asked = await timed("questions", () => askQuestions({ request, sources, remembered: {} }));
  console.log(`   kind: ${asked.kind}   tokens: ${asked.tokens.toLocaleString("en-IN")}`);
  for (const q of asked.questions) {
    console.log(`   - [${q.id}] ${q.text} (${q.type})${q.options.length ? ` options: ${q.options.join(" | ")}` : ""}${q.suggested.length ? `   suggested: ${q.suggested.join(", ")}` : ""}`);
  }

  // Answers as a person who accepts every suggestion would give them, with a
  // small count so the run stays cheap. Questions with no suggestion are skipped.
  const answers: Answer[] = asked.questions
    .filter((q) => q.id !== "count" && q.suggested.length)
    .map((q) => ({ question: q.text, answer: q.suggested.join(", ") }));
  answers.push({ question: "How many cards should I make?", answer: "5" });

  console.log("\n2. The cards (5 asked for)");
  const made = await timed("cards", () => makeCards({ request, sources, answers, count: 5 }));
  console.log(`   cards: ${made.cardCount}   left out: ${made.dropped}   tokens: ${made.tokens.toLocaleString("en-IN")}${made.note ? `\n   note: ${made.note}` : ""}`);
  made.chapters.forEach((c, i) => {
    console.log(`\n   ${i + 1}. ${c.title}`);
    for (const card of c.cards) {
      console.log(`      FRONT: ${card.front}\n      BACK:  ${card.back}${card.example ? `\n      E.g.:  ${card.example}` : ""}${card.body ? `\n      NOTES: ${card.body.replace(/\n/g, "\n             ")}` : ""}\n`);
    }
  });
  console.log(`Total tokens this run: ${(asked.tokens + made.tokens).toLocaleString("en-IN")} (the app's ceiling for one request's input is ${MAX_SOURCE_TOKENS.toLocaleString("en-IN")}).`);
}

async function runAudio(file: string) {
  const ext = path.extname(file).toLowerCase();
  if (!AUDIO_TYPES[ext]) throw new AiError(`Use one of: ${Object.keys(AUDIO_TYPES).join(", ")}`);
  const data = await readFileChecked(file);
  const bytes = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;

  console.log("\n1. Transcript (whisper-1). Read it against what was actually said:");
  console.log("   are the speaker's grammar mistakes still there, or did it quietly fix them?");
  const t = await timed("transcription", () => transcribeAudio({ data: bytes, filename: `audio${ext}`, contentType: AUDIO_TYPES[ext] }));
  console.log(`\n   "${t.text}"\n`);
  const s = speechStats(t);
  console.log(`   words: ${s.wordCount}  pace: ${s.wordsPerMinute || "n/a"} wpm  long pauses: ${s.pauseCount} (longest ${s.longestPauseSec}s)  hesitations: ${s.fillerCount}  repeats: ${s.repeatedWordCount}`);
  console.log(`   low-confidence stretches: ${s.lowConfidence.length ? s.lowConfidence.map((l) => `[${l.start.toFixed(1)}s] ${l.text}`).join(" / ") : "none"}`);

  console.log("\n2. The draft audit");
  const d = await timed("draft", () => draftAudit({ taskTitle: "Speaking practice (smoke test)", transcript: t, stats: s }));
  for (const k of ["grammar", "vocabulary", "fluency"] as const) console.log(`   ${k}: ${d[k].score}/10 - ${d[k].reason}`);
  console.log(`\n   summary: ${d.summary}`);
  for (const n of d.notes) console.log(`   [${n.at}s ${n.severity}] ${n.note}`);
}

/// One question, or a question and a follow-up, as the Help page would send them.
/// Asking twice also shows whether the help text was read from the cache.
async function runHelp(questions: string[]) {
  const history: HelpTurn[] = [];
  for (const q of questions) {
    console.log(`\n> ${q}`);
    const out = await timed("answer", () => askHelp({ question: q, history }));
    console.log(`${out.answer}\n   (${out.tokens} tokens)`);
    history.push({ role: "user", text: q }, { role: "assistant", text: out.answer });
  }
}

async function main() {
  const [mode, a, b] = process.argv.slice(2);
  if (mode === "cards" && a) return runCards(a, []);
  if (mode === "pdf" && a) {
    const data = await readFileChecked(a);
    return runCards(b ?? "Make flashcards from this file", [{ type: "pdf", data: data.toString("base64") }]);
  }
  if (mode === "image" && a) {
    const type = IMAGE_TYPES[path.extname(a).toLowerCase()];
    if (!type) throw new AiError("Use a .jpg, .png or .webp picture.");
    const data = await readFileChecked(a);
    return runCards(b ?? "Make flashcards from this picture", [{ type: "image", mediaType: type, data: data.toString("base64") }]);
  }
  if (mode === "audio" && a) return runAudio(a);
  if (mode === "help" && a) return runHelp(b ? [a, b] : [a]);
  console.log('Usage: npx tsx --env-file=.env scripts/ai-smoke.ts cards "<request>" | pdf <file> ["<request>"] | image <file> ["<request>"] | audio <file> | help "<question>" ["<follow-up>"]');
  process.exitCode = 1;
}

main().catch((err) => {
  // An AiError message is already written for a person (it is also used here
  // for a wrong file name); anything else is a bug worth seeing in full.
  console.error(err instanceof AiError ? `\nStopped: ${err.message}` : err);
  process.exitCode = 1;
});
