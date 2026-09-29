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
import { averageScore, STATUS_BADGE } from "@/lib/audits";
import { DEFAULT_PREFERENCES, PREFERENCE_SCHEMA } from "@/lib/preferences";
import { noteSchema } from "@/lib/validations";

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
  const badge =
    submission.status === "RETURNED" && submission.retry
      ? { text: "Replaced", variant: "neutral" as const }
      : STATUS_BADGE[submission.status];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/feedback" className="text-xs text-ink-muted hover:text-accent">
        ← My Audits
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">{submission.exercise.title}</h1>
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
}: {
  studentId: string;
  submission: {
    id: string;
    createdAt: Date;
    mediaKind: "AUDIO" | "VIDEO" | "IMAGE";
    exercise: { id: string };
    feedback: {
      pronunciation: number;
      grammar: number;
      fluency: number;
      vocabulary: number;
      confidence: number;
      summary: string;
      notes: unknown;
    };
  };
  mediaUrl: string | null;
}) {
  const [previous, user] = await Promise.all([
    // The audit just before this one, for the "+0.8 since last time" line.
    prisma.feedback.findFirst({
      where: {
        submission: { studentId, status: "REVIEWED", createdAt: { lt: submission.createdAt } },
      },
      orderBy: { submission: { createdAt: "desc" } },
      select: {
        pronunciation: true,
        grammar: true,
        fluency: true,
        vocabulary: true,
        confidence: true,
      },
    }),
    prisma.user.findUnique({ where: { id: studentId }, select: { preferences: true } }),
  ]);

  const prefs = PREFERENCE_SCHEMA.partial().safeParse(user?.preferences ?? {});
  const autoPlay = (prefs.success ? prefs.data.autoplayAudit : undefined) ?? DEFAULT_PREFERENCES.autoplayAudit;

  // The Json column is validated on read, not trusted: a note written by an
  // older version of the app should drop, not crash the page.
  const parsed = z.array(noteSchema).safeParse(submission.feedback.notes);

  return (
    <AuditReport
      exerciseId={submission.exercise.id}
      mediaUrl={mediaUrl}
      mediaKind={submission.mediaKind}
      notes={parsed.success ? parsed.data : []}
      feedback={submission.feedback}
      previousAverage={previous ? averageScore(previous) : null}
      autoPlay={autoPlay}
    />
  );
}
