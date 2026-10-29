// Owns one submission as the student sees it, whatever state it is in:
// waiting for a teacher, sent back (re-record here), or audited (read the
// audit). One URL per attempt, so a link from My Audits never goes stale as
// the status changes.
//
// It deliberately scopes the query by studentId in the WHERE clause. Another
// student's id simply returns nothing; fetching first and comparing after
// leaves a window where a mistyped early return leaks the row.

import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_UPLOAD_BYTES, resolveMediaUrl } from "@/lib/storage";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { Player } from "@/components/media/Player";
import { AuditReport } from "@/components/student/AuditReport";
import { SendBackView } from "@/components/student/SendBackView";
import { STATUS_BADGE } from "@/lib/audits";
import { overallOf, retryHref, SKILLS, type SkillScores } from "@/lib/auditReport";
import { prefsOf } from "@/lib/preferences";
import { noteSchema } from "@/lib/validations";
import { cardNoun } from "@/lib/chunkCard";

export const revalidate = 0;

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const studentId = session?.user?.id;

  const submission = await prisma.submission.findFirst({
    where: { id, studentId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      mediaUrl: true,
      mediaKind: true,
      returnReason: true,
      returnNote: true,
      retry: { select: { id: true } },
      wordId: true,
      word: { select: { id: true, code: true, deckId: true, text: true, kind: true } },
      // For where the audit player starts. Same row, so no second query.
      student: { select: { preferences: true } },
      exercise: {
        select: { id: true, title: true, prompt: true, expects: true, maxSeconds: true },
      },
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

  if (!submission) notFound();

  // Signed on the server and short-lived. The raw storage key never reaches
  // the browser.
  const mediaUrl = await resolveMediaUrl(submission.mediaUrl);
  const prefs = prefsOf(submission.student.preferences);
  const badge =
    submission.status === "RETURNED" && submission.retry
      ? { text: "Replaced", variant: "neutral" as const }
      : STATUS_BADGE[submission.status];

  return (
    // Wider only for a finished audit: it has a second column on a computer.
    <main
      className={`mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 ${submission.status === "REVIEWED" ? "lg:max-w-6xl" : ""}`}
    >
      <Link href="/feedback" className="text-xs text-ink-muted hover:text-accent">
        ← My Audits
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">
          {submission.word ? `${cardNoun(submission.word.kind)}: ${submission.word.text}` : submission.exercise.title}
        </h1>
        <Badge variant={badge.variant} className="mt-1 shrink-0">
          {badge.text}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Sent {submission.createdAt.toLocaleDateString("en-IN")}
        {submission.feedback
          ? ` · reviewed ${submission.feedback.createdAt.toLocaleDateString("en-IN")}`
          : ""}
      </p>

      {submission.status === "REVIEWED" && submission.feedback ? (
        <Reviewed
          studentId={studentId!}
          submission={{ ...submission, feedback: submission.feedback }}
          mediaUrl={mediaUrl}
          autoPlay={prefs.autoplayAudit}
          playbackRate={prefs.playbackRate}
        />
      ) : submission.status === "RETURNED" ? (
        <SendBackView
          submissionId={submission.id}
          exercise={submission.exercise}
          reason={submission.returnReason}
          note={submission.returnNote}
          mediaUrl={mediaUrl}
          mediaKind={submission.mediaKind}
          replacementId={submission.retry?.id ?? null}
          wordId={submission.wordId}
          maxBytes={MAX_UPLOAD_BYTES}
        />
      ) : (
        <>
          <Card className="mt-5">
            <CardTitle>
              {submission.status === "IN_REVIEW"
                ? "A teacher is reviewing this now"
                : "Waiting for a teacher"}
            </CardTitle>
            <p className="mt-2 text-sm text-ink-muted">
              {submission.status === "IN_REVIEW"
                ? "The audit appears on this page as soon as the teacher sends it."
                : "Submissions are reviewed oldest first, by a person. This page updates when the audit is ready."}
            </p>
          </Card>
          {mediaUrl && submission.mediaKind !== "IMAGE" ? (
            <Card className="mt-4">
              <CardTitle>What you sent</CardTitle>
              <Player
                src={mediaUrl}
                kind={submission.mediaKind === "VIDEO" ? "VIDEO" : "AUDIO"}
                showSpeed
                initialRate={prefs.playbackRate}
                className="mt-3"
              />
            </Card>
          ) : null}
        </>
      )}
    </main>
  );
}

async function Reviewed({
  studentId,
  submission,
  mediaUrl,
  autoPlay,
  playbackRate,
}: {
  studentId: string;
  submission: {
    id: string;
    createdAt: Date;
    mediaKind: "AUDIO" | "VIDEO" | "IMAGE";
    exercise: { id: string; prompt: string };
    word: { id: string; code: string; deckId: string | null } | null;
    feedback: SkillScores & { summary: string; notes: unknown };
  };
  mediaUrl: string | null;
  autoPlay: boolean;
  playbackRate: number;
}) {
  // This audit and the four before it, newest first, for the skill changes
  // and the progress strip; the count gives "Audit N". Both scoped by
  // studentId in the WHERE clause.
  const upTo = { studentId, status: "REVIEWED" as const, createdAt: { lte: submission.createdAt } };
  const [recent, number] = await Promise.all([
    prisma.feedback.findMany({
      where: { submission: upTo },
      orderBy: { submission: { createdAt: "desc" } },
      take: 5,
      select: { submissionId: true, pronunciation: true, grammar: true, fluency: true, vocabulary: true, confidence: true },
    }),
    prisma.submission.count({ where: upTo }),
  ]);
  const scoresOf = (f: SkillScores): SkillScores =>
    Object.fromEntries(SKILLS.map((k) => [k.key, f[k.key]])) as SkillScores;
  // Positional, not "the second row": two attempts sent in the same instant
  // must still compare this audit with the one before it.
  const at = recent.findIndex((f) => f.submissionId === submission.id);
  const previous = at >= 0 && recent[at + 1] ? scoresOf(recent[at + 1]) : null;
  const scores = recent.slice(Math.max(at, 0)).map(overallOf).reverse();

  // The Json column is validated on read, not trusted: a note written by an
  // older version of the app should drop, not crash the page.
  const parsed = z.array(noteSchema).safeParse(submission.feedback.notes);

  return (
    <AuditReport
      retryHref={retryHref(submission.exercise.id, submission.word)}
      prompt={submission.exercise.prompt}
      mediaUrl={mediaUrl}
      mediaKind={submission.mediaKind}
      notes={parsed.success ? parsed.data : []}
      feedback={submission.feedback}
      previous={previous}
      history={{ number, scores }}
      autoPlay={autoPlay}
      playbackRate={playbackRate}
    />
  );
}
