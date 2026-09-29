// Owns one audit: the five scores, the summary, and the submission with its
// notes.
//
// Playback and the note list are delegated to AuditPlayback, which is a client
// component. Everything else here stays on the server — the scores and summary
// are read-only text and have no reason to ship JavaScript.

import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveMediaUrl } from "@/lib/storage";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { AuditPlayback } from "@/components/review/AuditPlayback";
import { noteSchema } from "@/lib/validations";

export const revalidate = 0;

const CRITERIA = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "grammar", label: "Grammar" },
  { key: "fluency", label: "Fluency" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "confidence", label: "Confidence" },
] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const studentId = session?.user?.id;

  // studentId is in the WHERE clause, so another student's id simply returns
  // nothing. Fetching first and comparing after leaves a window where a
  // mistyped early return leaks the row.
  const submission = await prisma.submission.findFirst({
    where: { id, studentId },
    select: {
      id: true,
      createdAt: true,
      mediaUrl: true,
      mediaKind: true,
      exercise: { select: { title: true, prompt: true } },
      feedback: {
        select: {
          pronunciation: true,
          grammar: true,
          fluency: true,
          vocabulary: true,
          confidence: true,
          summary: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });

  if (!submission?.feedback) notFound();

  const { feedback } = submission;

  // Signed on the server, expires in half an hour. The raw storage key never
  // reaches the browser.
  const mediaUrl = await resolveMediaUrl(submission.mediaUrl);

  // The Json column is validated on read, not trusted. It was written by an
  // older version of this app the moment the note shape changes, and a bad row
  // should drop a note rather than crash the page a student is trying to read.
  const parsed = z.array(noteSchema).safeParse(feedback.notes);
  const noteList = parsed.success ? parsed.data : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/feedback" className="text-xs text-ink-muted hover:text-accent">
        ← All audits
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-ink">
        {submission.exercise.title}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Submitted {submission.createdAt.toLocaleDateString("en-IN")} · reviewed{" "}
        {feedback.createdAt.toLocaleDateString("en-IN")}
      </p>

      <Card className="mt-6">
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
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${value * 10}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4">
        <CardTitle>What your teacher said</CardTitle>
        {/* whitespace-pre-line so the teacher's paragraph breaks survive. */}
        <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">
          {feedback.summary}
        </p>
      </Card>

      {/* Images have no timeline, so there is nothing to seek and no player to
          mount — a still photo and a static list is the whole interaction. */}
      {mediaUrl && submission.mediaKind !== "IMAGE" ? (
        <AuditPlayback
          mediaUrl={mediaUrl}
          mediaKind={submission.mediaKind}
          notes={noteList}
        />
      ) : (
        <>
          <Card className="mt-4">
            <CardTitle>Your submission</CardTitle>
            <div className="mt-3">
              {/* A missing file is not fatal here, unlike on the teacher's
                  page. The audit is what the student came for — losing the
                  recording is a shame, not a reason to hide the feedback. */}
              {!mediaUrl ? (
                <p className="text-sm text-ink-muted">
                  This recording is no longer available to play. Your audit
                  above is unaffected.
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
          </Card>

          {noteList.length > 0 ? (
            <Card className="mt-4">
              <CardTitle>Notes</CardTitle>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {noteList.map((n, i) => (
                  <li key={`${n.at}-${i}`} className="flex items-start gap-3 py-3">
                    <span className="shrink-0 font-mono text-xs text-accent">
                      {formatTime(n.at)}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-ink">{n.note}</p>
                    <Badge variant={n.severity === "major" ? "error" : "neutral"}>
                      {n.severity}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}
    </main>
  );
}
