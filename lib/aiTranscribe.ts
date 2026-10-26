// Owns turning a recording into a transcript plus the measurable speech facts
// the AI draft audit is built on: words per minute, pauses, hesitation sounds
// and the stretches Whisper was unsure about.
//
// It deliberately does NOT read from storage, check who is allowed to call it,
// write to the database, or call Claude. The route hands it the audio bytes,
// and lib/aiDraft.ts turns the result into a rubric draft. Keeping it that
// narrow is what lets the numbers below be tested without an API key.
//
// whisper-1 is used on purpose, not the newer gpt-4o-transcribe models: only
// whisper-1 returns word timestamps and per-segment confidence, and both are
// needed (timestamps for fluency, confidence for the pronunciation hints).

import { z } from "zod";

/// Whisper rejects anything larger; checked first so the teacher gets a clear
/// message instead of a failed upload after a long wait.
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

/// Shorter than the route's maxDuration (60 s) so a slow API call fails with
/// our message, not with Vercel killing the function mid-request.
const TIMEOUT_MS = 50_000;

/// Whisper's own cut-off for "this decode is unreliable". Using its number
/// rather than inventing one means a flagged stretch is one Whisper itself
/// distrusted.
const LOW_CONFIDENCE_LOGPROB = -1.0;

/// A gap this long between two words is a pause a listener notices.
const PAUSE_SEC = 1.0;

/// Hesitation sounds only. "like" and "you know" are left out: they are often
/// ordinary English, and counting them would mark fluent speakers down.
const FILLER = /^(?:u+m+|u+h+|e+r+m*|a+h+|h+m+|m+h*m+)$/i;

/// An error whose message is safe to show a teacher as it is, and says what to
/// do next. Anything else thrown here is a bug, not a user-facing condition.
export class AiError extends Error {}

export type TranscriptWord = { word: string; start: number; end: number };
export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
  avgLogprob: number;
  noSpeechProb: number;
};
export type Transcript = {
  text: string;
  durationSec: number;
  words: TranscriptWord[];
  segments: TranscriptSegment[];
};

export type SpeechStats = {
  wordCount: number;
  /// Over the time between the first and last word, not the whole file, so a
  /// slow start or a long silent tail does not drag the pace down.
  wordsPerMinute: number;
  pauseCount: number;
  longestPauseSec: number;
  fillerCount: number;
  /// "I I want" — the same word twice in a row; a false-start signal.
  repeatedWordCount: number;
  /// Stretches Whisper itself was unsure about. Hints for the teacher to
  /// listen to, never evidence of a mispronunciation on their own.
  lowConfidence: { start: number; end: number; text: string }[];
};

// Parsed with Zod rather than trusted: this is a third-party response, and a
// changed shape should fail here with a clear message, not three calls later
// as "undefined is not iterable".
const whisperSchema = z.object({
  text: z.string(),
  duration: z.number().optional(),
  words: z.array(z.object({ word: z.string(), start: z.number(), end: z.number() })).default([]),
  segments: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        text: z.string(),
        avg_logprob: z.number().default(0),
        no_speech_prob: z.number().default(0),
      }),
    )
    .default([]),
});

export async function transcribeAudio(input: {
  data: ArrayBuffer;
  filename: string;
  contentType: string;
}): Promise<Transcript> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new AiError("The AI draft is not switched on yet. Write the audit by hand, or ask an admin to add the OpenAI key.");
  }
  if (input.data.byteLength === 0) {
    throw new AiError("This recording is empty, so there is nothing to transcribe. Send it back to the student.");
  }
  if (input.data.byteLength > MAX_AUDIO_BYTES) {
    throw new AiError("This recording is over 25 MB, which is too large for the AI draft. Write this audit by hand.");
  }

  const form = new FormData();
  form.append("file", new Blob([input.data], { type: input.contentType }), input.filename);
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");
  form.append("language", "en");
  // Whisper tidies speech by default and drops "um" and repeated words, which
  // are exactly what the fluency numbers need. A prompt written in the style
  // we want back is the documented way to keep them.
  form.append("prompt", "Umm, let me think, like, hmm... Okay, so, I, I think it was, uh, yesterday.");

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new AiError("The transcription service did not answer in time. Try again in a minute, or write this audit by hand.");
  }

  const raw = await res.text();
  if (!res.ok) {
    // The body can echo request details; it is not logged or shown.
    throw new AiError(
      res.status === 429
        ? "The AI service is busy or its budget is used up. Try again later, or write this audit by hand."
        : "The transcription failed. Try again, or write this audit by hand.",
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new AiError("The transcription came back unreadable. Try again, or write this audit by hand.");
  }
  const parsed = whisperSchema.safeParse(json);
  if (!parsed.success) {
    throw new AiError("The transcription came back in an unexpected form. Try again, or write this audit by hand.");
  }

  const p = parsed.data;
  const words = p.words.map((w) => ({ word: w.word.trim(), start: w.start, end: w.end })).filter((w) => w.word);
  return {
    text: p.text.trim(),
    durationSec: p.duration ?? words.at(-1)?.end ?? 0,
    words,
    segments: p.segments.map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
      avgLogprob: s.avg_logprob,
      noSpeechProb: s.no_speech_prob,
    })),
  };
}

const bare = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

export function speechStats(t: Transcript): SpeechStats {
  const { words } = t;
  const first = words[0];
  const last = words.at(-1);
  const spanSec = first && last ? last.end - first.start : 0;

  let pauseCount = 0;
  let longestPauseSec = 0;
  let fillerCount = 0;
  let repeatedWordCount = 0;

  words.forEach((w, i) => {
    const b = bare(w.word);
    if (FILLER.test(b)) fillerCount += 1;
    const prev = words[i - 1];
    if (!prev) return;
    const gap = w.start - prev.end;
    if (gap >= PAUSE_SEC) pauseCount += 1;
    if (gap > longestPauseSec) longestPauseSec = gap;
    if (b && b === bare(prev.word) && !FILLER.test(b)) repeatedWordCount += 1;
  });

  return {
    wordCount: words.length,
    // Under 2 seconds of speech gives a wild number (one word = 60 wpm or
    // 600), so no pace is reported rather than a misleading one.
    wordsPerMinute: spanSec >= 2 ? Math.round((words.length / spanSec) * 60) : 0,
    pauseCount,
    longestPauseSec: Math.round(longestPauseSec * 10) / 10,
    fillerCount,
    repeatedWordCount,
    lowConfidence: t.segments
      // Silence has no real words to judge; Whisper's confidence there says
      // nothing about how the student spoke.
      .filter((s) => s.avgLogprob < LOW_CONFIDENCE_LOGPROB && s.noSpeechProb < 0.6)
      .map((s) => ({ start: s.start, end: s.end, text: s.text })),
  };
}
