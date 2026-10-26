// Owns the "AI draft" card on the audit page: the button that asks
// /api/submissions/[id]/ai-draft for a draft, the loading and error states, and
// showing the teacher WHY each score was suggested, plus the transcript the
// AI worked from.
//
// It deliberately does NOT write into the form itself. It hands the draft to
// onApply and RubricForm decides what may be filled, so a teacher's own scores
// and words are never overwritten from here. It also never sends anything to
// the student.

"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import type { AiDraft } from "@/lib/aiDraft";
import type { SpeechStats } from "@/lib/aiTranscribe";

type Result = { draft: AiDraft; transcript: string; stats: SpeechStats };

const ROWS = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "fluency", label: "Fluency" },
] as const;

export function AiDraftPanel({ submissionId, onApply }: { submissionId: string; onApply: (draft: AiDraft) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/ai-draft`, { method: "POST" });
      const raw = await res.text();
      let data: { error?: string; draft?: AiDraft; transcript?: string; stats?: SpeechStats } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: "Something went wrong making the draft. Try again, or write this audit by hand." };
      }
      if (!res.ok || !data.draft || !data.stats) {
        setError(data.error ?? "Could not make a draft. Try again, or write this audit by hand.");
        return;
      }
      setResult({ draft: data.draft, transcript: data.transcript ?? "", stats: data.stats });
      onApply(data.draft);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardTitle>AI draft</CardTitle>
      <p className="mt-2 text-xs text-ink-muted">
        A first draft from a transcript of the recording. It fills grammar, vocabulary and fluency, some notes and the
        summary where you have not written yet. Pronunciation and confidence are always yours.
      </p>
      <Button className="mt-3 w-full" variant="outline" onClick={() => void generate()} disabled={busy}>
        <Sparkles className="size-4" aria-hidden="true" />
        {busy ? "Making the draft…" : result ? "Make another draft" : "Make an AI draft"}
      </Button>
      <p role="status" aria-live="polite" className="mt-2 text-xs text-ink-muted">
        {busy ? "This can take up to 30 seconds. You can keep listening meanwhile." : ""}
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          <p className="text-xs text-ink">
            The draft is in the form. The sliders moved but still say &ldquo;not set&rdquo;: listen, then tap each one to
            confirm it. Check every added note against the recording and remove any that are wrong.
          </p>
          <ul className="flex flex-col gap-2">
            {ROWS.map((r) => (
              <li key={r.key} className="text-xs">
                <span className="font-medium text-ink">
                  {r.label}: AI suggests {result.draft[r.key].score}/10
                </span>
                <span className="block text-ink-muted">{result.draft[r.key].reason}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-muted">
            Measured: {result.stats.wordCount} words
            {result.stats.wordsPerMinute ? `, ${result.stats.wordsPerMinute} per minute` : ""}. Long pauses:{" "}
            {result.stats.pauseCount}. Hesitation sounds: {result.stats.fillerCount}. Repeated words:{" "}
            {result.stats.repeatedWordCount}.
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer font-medium text-ink">Transcript the AI used</summary>
            <p className="mt-2 whitespace-pre-wrap text-ink-muted">{result.transcript || "(empty)"}</p>
            <p className="mt-2 text-ink-muted">
              Speech-to-text can quietly fix a student&rsquo;s mistakes, so a clean transcript does not prove clean speech.
              Judge by listening.
            </p>
          </details>
        </div>
      ) : null}
    </Card>
  );
}
