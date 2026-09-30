// Owns the finished-audit view (spec S-11): overall score, the sticky player
// with timestamped notes, the five scores, the teacher's summary, and the
// "try again" call to action.
//
// Notes come before scores on purpose. "Where exactly did I go wrong" is the
// thing a student opens an audit for; the numbers are the summary of it.
//
// It deliberately stays a server component. Only AuditPlayback needs the
// browser, and it is the smallest possible client boundary.

import Link from "next/link";
import type { MediaKind } from "@prisma/client";

import { Card, CardTitle } from "@/components/ui/Card";
import { AuditPlayback } from "@/components/review/AuditPlayback";
import { NoteList } from "@/components/review/NoteList";
import { averageScore } from "@/lib/audits";
import type { NoteInput } from "@/lib/validations";

const CRITERIA = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "grammar", label: "Grammar" },
  { key: "fluency", label: "Fluency" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "confidence", label: "Confidence" },
] as const;

type Scores = Record<(typeof CRITERIA)[number]["key"], number>;

export function AuditReport({
  exerciseId,
  mediaUrl,
  mediaKind,
  notes,
  feedback,
  previousAverage,
  autoPlay,
}: {
  exerciseId: string;
  mediaUrl: string | null;
  mediaKind: MediaKind;
  notes: readonly NoteInput[];
  feedback: Scores & { summary: string };
  previousAverage: number | null;
  autoPlay: boolean;
}) {
  const overall = averageScore(feedback);
  const delta = previousAverage === null ? null : overall - previousAverage;

  return (
    <>
      <Card className="mt-5 flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-muted">Overall</p>
          <p className="font-mono text-3xl font-bold text-ink">
            {overall.toFixed(1)}
            <span className="text-base font-normal text-ink-muted">/10</span>
          </p>
        </div>
        {delta !== null ? (
          <p
            className={
              delta >= 0 ? "text-sm font-medium text-success" : "text-sm font-medium text-error"
            }
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)} since your last audit
          </p>
        ) : (
          <p className="text-sm text-ink-muted">Your first audit</p>
        )}
      </Card>

      {mediaUrl && mediaKind !== "IMAGE" ? (
        <AuditPlayback
          mediaUrl={mediaUrl}
          mediaKind={mediaKind}
          notes={notes}
          autoPlay={autoPlay}
        />
      ) : (
        <Card className="mt-4">
          <CardTitle>Your submission</CardTitle>
          <div className="mt-3">
            {/* A missing file is not fatal here, unlike on the teacher's page:
                the audit is what the student came for. */}
            {!mediaUrl ? (
              <p className="text-sm text-ink-muted">
                This recording is no longer available to play. Your audit is
                unaffected.
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt="Your written work"
                className="max-h-[32rem] w-full rounded-lg border border-border object-contain"
              />
            )}
          </div>
          {notes.length > 0 ? (
            <div className="mt-4">
              <NoteList notes={notes} />
            </div>
          ) : null}
        </Card>
      )}

      <Card className="mt-4">
        <CardTitle>Scores</CardTitle>
        <div className="mt-4 flex flex-col gap-3">
          {CRITERIA.map((c) => {
            const value = feedback[c.key];
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{c.label}</span>
                  <span className="font-mono text-ink">{value}/10</span>
                </div>
                <div
                  className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-dim"
                  role="img"
                  aria-label={`${c.label}: ${value} out of 10`}
                >
                  <div className="h-full rounded-full bg-accent" style={{ width: `${value * 10}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4">
        <CardTitle>What your teacher said</CardTitle>
        {/* whitespace-pre-line so the teacher's paragraph breaks survive. */}
        <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{feedback.summary}</p>
      </Card>

      <Link
        href={`/practice/${exerciseId}`}
        className="mt-6 flex h-12 items-center justify-center rounded-lg bg-accent text-sm font-medium text-on-accent hover:bg-accent-dark"
      >
        Try this exercise again
      </Link>
    </>
  );
}
