// Owns the teacher's audit workstation form (spec T-03): the sticky player
// with "+ Note at current time", timestamped notes, five rubric scores, the
// summary, draft autosave and a confirm step before sending.
//
// Playback and notes sit together on purpose. A note is captured the moment
// the teacher hears the problem, so the button that stamps the time lives on
// the player itself and stays in view however far down the form they are.
//
// Every change is saved to this browser (lib/draftStorage.ts), keyed by
// submission, so a closed tab or a crash loses nothing already written.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaKind } from "@prisma/client";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Player } from "@/components/media/Player";
import { NoteComposer } from "@/components/review/NoteComposer";
import { SubmitBar } from "@/components/review/SubmitBar";
import { CRITERIA, ScorePanel, type CriterionKey, type Scores } from "@/components/review/ScorePanel";
import { clearDraft, readDraft, saveDraft } from "@/lib/draftStorage";
import { feedbackSchema, type NoteInput } from "@/lib/validations";

const START: Scores = { pronunciation: 5, grammar: 5, fluency: 5, vocabulary: 5, confidence: 5 };

function fmt(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

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
  // Refs, not state: onTimeUpdate fires several times a second, and state here
  // would re-render the summary textarea on every tick.
  const timeRef = useRef(0);
  const seekRef = useRef<((s: number) => void) | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const [scores, setScores] = useState<Scores>(START);
  const [touched, setTouched] = useState<Set<CriterionKey>>(new Set());
  const [notes, setNotes] = useState<NoteInput[]>([]);
  const [summary, setSummary] = useState("");
  const [draft, setDraft] = useState("");
  const [draftAt, setDraftAt] = useState(0);
  const [severity, setSeverity] = useState<"minor" | "major">("minor");
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Restore after mount, not during render: localStorage does not exist on
  // the server, and reading it in render would mismatch hydration.
  useEffect(() => {
    const d = readDraft(submissionId);
    if (d) {
      setScores({ pronunciation: d.pronunciation, grammar: d.grammar, fluency: d.fluency, vocabulary: d.vocabulary, confidence: d.confidence });
      setTouched(new Set((d.touched ?? []).filter((k): k is CriterionKey => CRITERIA.some((c) => c.key === k))));
      setNotes(d.notes);
      setSummary(d.summary);
      setSavedAt(new Date());
    }
    setLoaded(true);
  }, [submissionId]);

  const dirty = touched.size > 0 || notes.length > 0 || summary.trim().length > 0;

  useEffect(() => {
    if (!loaded || !dirty) return;
    saveDraft(submissionId, { ...scores, notes, summary, touched: [...touched] });
    setSavedAt(new Date());
  }, [loaded, dirty, submissionId, scores, notes, summary, touched]);

  // The browser's own "leave site?" prompt. The draft survives anyway; this
  // stops the accidental back-swipe that makes the teacher think it did not.
  useEffect(() => {
    if (!dirty || busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);

  const needsNotes = mediaKind !== "IMAGE";
  const missing = useMemo(() => {
    const m: string[] = [];
    const unset = CRITERIA.filter((c) => !touched.has(c.key)).map((c) => c.label);
    if (unset.length) m.push(`Set ${unset.join(", ")}`);
    if (needsNotes && notes.length === 0) m.push("Add at least one timestamped note");
    if (summary.trim().length < 40) m.push(`Summary needs ${40 - summary.trim().length} more characters`);
    return m;
  }, [touched, notes, summary, needsNotes]);

  function stampNow() {
    setDraftAt(Math.round(timeRef.current * 10) / 10);
    noteRef.current?.focus();
  }

  function addNote() {
    const text = draft.trim();
    if (text.length < 3) {
      setError("Write at least a few words in the note.");
      return;
    }
    if (durationSec !== null && draftAt > durationSec) {
      setError(`That time is past the end of the recording (${fmt(durationSec)}).`);
      return;
    }
    setError(null);
    // Kept sorted, so the student reads them in the order they happen.
    setNotes((n) => [...n, { at: draftAt, note: text, severity }].sort((a, b) => a.at - b.at));
    setDraft("");
  }

  function review() {
    setShowMissing(true);
    setError(null);
    if (missing.length === 0) setConfirming(true);
  }

  async function send() {
    const parsed = feedbackSchema.safeParse({ action: "submit", submissionId, ...scores, summary, notes });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the audit and try again.");
      setConfirming(false);
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
        data = { error: "Something went wrong. Your audit is saved here — try again." };
      }
      if (!res.ok) {
        setError(data.error ?? "Could not save the audit. It is saved here — try again.");
        setBusy(false);
        setConfirming(false);
        return;
      }
      clearDraft(submissionId);
      router.push("/queue");
      router.refresh();
    } catch {
      setError("Could not reach the server. Your audit is saved here — try again.");
      setBusy(false);
      setConfirming(false);
    }
  }

  const average = CRITERIA.reduce((t, c) => t + scores[c.key], 0) / 5;

  return (
    <div className="mt-6 pb-24">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          {mediaKind === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="The student's written work" className="max-h-[36rem] w-full rounded-lg border border-border object-contain" />
          ) : (
            <div className="sticky top-14 z-20 -mx-2 bg-paper/95 px-2 py-2 backdrop-blur">
              <Player
                src={mediaUrl}
                kind={mediaKind === "VIDEO" ? "VIDEO" : "AUDIO"}
                showSpeed
                onTimeUpdate={(t) => {
                  timeRef.current = t;
                }}
                onReady={(seekTo) => {
                  seekRef.current = seekTo;
                }}
              />
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={stampNow}>
                  + Note at current time
                </Button>
              </div>
            </div>
          )}

          {needsNotes ? (
            <NoteComposer
              notes={notes}
              onSeek={(at) => seekRef.current?.(at)}
              onRemove={(i) => setNotes((l) => l.filter((_, j) => j !== i))}
              draft={draft}
              onDraft={setDraft}
              draftAt={draftAt}
              onDraftAt={setDraftAt}
              severity={severity}
              onSeverity={setSeverity}
              onAdd={addNote}
              durationSec={durationSec}
              noteRef={noteRef}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardTitle>Scores</CardTitle>
            <div className="mt-4">
              <ScorePanel
                scores={scores}
                touched={touched}
                showMissing={showMissing}
                onChange={(k, v) => {
                  setScores((s) => ({ ...s, [k]: v }));
                  setTouched((t) => (t.has(k) ? t : new Set(t).add(k)));
                }}
              />
            </div>
          </Card>
          <Card>
            <CardTitle>Summary</CardTitle>
            <textarea
              rows={7}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What went well, what to work on next, and one thing to practise before the next submission."
              aria-label="Summary"
              aria-invalid={(showMissing && summary.trim().length < 40) || undefined}
              className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink placeholder:text-mist hover:border-border-strong focus:border-accent focus:outline-none aria-[invalid=true]:border-error"
            />
            <p className="mt-1 text-xs text-ink-muted">{summary.trim().length} characters — at least 40.</p>
          </Card>
        </div>
      </div>

      <SubmitBar
        savedAt={savedAt}
        error={error}
        missing={showMissing ? missing : []}
        confirming={confirming}
        busy={busy}
        average={average}
        noteCount={notes.length}
        onReview={review}
        onBack={() => setConfirming(false)}
        onSend={() => void send()}
      />
    </div>
  );
}
