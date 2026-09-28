// Owns the teacher's audit form: playback, five rubric scores, timestamped
// notes, and the summary.
//
// Playback and notes are together on purpose. A note is captured at the moment
// the teacher hears the problem, so the "add note here" button has to sit next
// to the audio it refers to — separating them means pausing, remembering a
// number, and typing it by hand.
//
// It deliberately uses a plain <audio> element. The real Player with waveform
// and seek-to-note arrives in Phase 5; this proves the flow first.

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { MediaKind } from "@prisma/client";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Player } from "@/components/media/Player";
import { NoteList } from "@/components/review/NoteList";
import { feedbackSchema, type NoteInput } from "@/lib/validations";

const CRITERIA = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "grammar", label: "Grammar" },
  { key: "fluency", label: "Fluency" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "confidence", label: "Confidence" },
] as const;

type Scores = Record<(typeof CRITERIA)[number]["key"], number>;

export function RubricForm({
  submissionId,
  mediaUrl,
  mediaKind,
  durationSec,
}: {
  submissionId: string;
  mediaUrl: string;
  mediaKind: MediaKind;
  durationSec: number | null;
}) {
  const router = useRouter();

  // Refs, not state. onTimeUpdate fires several times a second, and putting
  // that in state would re-render the summary textarea on every tick — which
  // is how a teacher loses their cursor position mid-sentence.
  const timeRef = useRef(0);
  const seekRef = useRef<((seconds: number) => void) | null>(null);

  // Starts at 5, not 0. A slider parked at zero looks like a score the teacher
  // gave rather than one they have not touched yet.
  const [scores, setScores] = useState<Scores>({
    pronunciation: 5,
    grammar: 5,
    fluency: 5,
    vocabulary: 5,
    confidence: 5,
  });

  const [notes, setNotes] = useState<NoteInput[]>([]);
  const [draft, setDraft] = useState("");
  const [draftAt, setDraftAt] = useState(0);
  const [severity, setSeverity] = useState<"minor" | "major">("minor");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function addNote() {
    const text = draft.trim();
    if (text.length < 3) {
      setError("Write at least a few words in the note.");
      return;
    }

    setError(null);
    // Kept sorted, so the student reads them in the order they happen.
    setNotes((n) =>
      [...n, { at: draftAt, note: text, severity }].sort((a, b) => a.at - b.at),
    );
    setDraft("");
  }

  async function handleSubmit() {
    setError(null);

    const parsed = feedbackSchema.safeParse({
      action: "submit",
      submissionId,
      ...scores,
      summary,
      notes,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the audit and try again.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const raw = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        setError("Something went wrong. Your notes are still here — try again.");
        setBusy(false);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Could not save the audit. Try again.");
        setBusy(false);
        return;
      }

      router.push("/queue");
      router.refresh();
    } catch {
      setError("Could not reach the server. Your notes are still here — try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <Card>
        <CardTitle>Submission</CardTitle>
        <div className="mt-3">
          {mediaKind === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt="The student's written work"
              className="max-h-[32rem] w-full rounded-lg border border-border object-contain"
            />
          ) : (
            <Player
              src={mediaUrl}
              kind={mediaKind === "VIDEO" ? "VIDEO" : "AUDIO"}
              onTimeUpdate={(t) => {
                timeRef.current = t;
              }}
              onReady={(seekTo) => {
                seekRef.current = seekTo;
              }}
            />
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>Scores</CardTitle>
        <div className="mt-4 flex flex-col gap-4">
          {CRITERIA.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between">
                <Label htmlFor={c.key} className="mb-0">
                  {c.label}
                </Label>
                <span className="font-mono text-sm text-ink">
                  {scores[c.key]}
                </span>
              </div>
              <input
                id={c.key}
                type="range"
                min={0}
                max={10}
                step={1}
                value={scores[c.key]}
                onChange={(e) =>
                  setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }))
                }
                // The number beside the label is the accessible value; a range
                // input announces it natively, so no extra aria is needed.
                className="mt-2 w-full accent-[var(--color-accent)]"
              />
            </div>
          ))}
        </div>
      </Card>

      {mediaKind !== "IMAGE" ? (
        <Card>
          <CardTitle>Timestamped notes</CardTitle>
          <p className="mt-1 text-xs text-ink-muted">
            At least one is required — it is the part that tells the student
            where the problem was.
          </p>

          <div className="mt-4">
            <NoteList
              notes={notes}
              onSeek={(at) => seekRef.current?.(at)}
              onRemove={(i) => setNotes((list) => list.filter((_, j) => j !== i))}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <div className="w-28">
                <Label htmlFor="noteAt">At</Label>
                <Input
                  id="noteAt"
                  type="number"
                  min={0}
                  max={durationSec ?? undefined}
                  step={0.1}
                  value={draftAt}
                  onChange={(e) => setDraftAt(Number(e.target.value))}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                // Rounded to one decimal. Millisecond precision reads as noise
                // and buys nothing when the note refers to a whole sentence.
                onClick={() => setDraftAt(Math.round(timeRef.current * 10) / 10)}
              >
                Use current time
              </Button>
            </div>

            <div>
              <Label htmlFor="noteText">Note</Label>
              <textarea
                id="noteText"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What did you hear at this moment?"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink placeholder:text-mist hover:border-border-strong focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={severity === "minor" ? "primary" : "outline"}
                size="sm"
                onClick={() => setSeverity("minor")}
              >
                Minor
              </Button>
              <Button
                variant={severity === "major" ? "primary" : "outline"}
                size="sm"
                onClick={() => setSeverity("major")}
              >
                Major
              </Button>
              <Button size="sm" className="ml-auto" onClick={addNote}>
                Add note
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Summary</CardTitle>
        <textarea
          rows={6}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What went well, what to work on next, and one thing to practise before the next submission."
          aria-label="Summary"
          className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink placeholder:text-mist hover:border-border-strong focus:border-accent focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink-muted">
          {summary.trim().length} characters — at least 40 needed.
        </p>
      </Card>

      {error ? (
        <p role="alert" aria-live="assertive" className="text-xs text-error">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={() => void handleSubmit()} disabled={busy}>
          {busy ? "Saving…" : "Send audit to student"}
        </Button>
        <p className="text-xs text-ink-muted">
          This cannot be edited after sending.
        </p>
      </div>
    </div>
  );
}
