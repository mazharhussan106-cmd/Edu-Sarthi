// Owns the audit workstation page (spec T-03): the header with the student's
// anonymized ID, the claim countdown, Release and Send back, then the prompt
// and the rubric form.
//
// It does NOT claim on open. Claiming is a deliberate button press (here or in
// the queue), so a teacher who only peeks at a submission never locks it away
// from everyone else for half an hour.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayId } from "@/lib/publicId";
import { resolveMediaUrl } from "@/lib/storage";
import { detailsOf } from "@/lib/wordCard";
import { CLAIM_MINUTES, claimExpiresAt, releaseExpiredClaims } from "@/lib/claims";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { ClaimButton, ClaimTimer, ReleaseButton } from "@/components/review/ClaimControls";
import { RubricForm } from "@/components/review/RubricForm";
import { SendBackForm } from "@/components/review/SendBackForm";
import { cardNoun, chunkDetailsOf, chunkGloss } from "@/lib/chunkCard";

export const revalidate = 0;

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Card>
        <CardTitle>{title}</CardTitle>
        <div className="mt-2 text-sm text-ink-muted">{children}</div>
        <Link href="/queue" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Back to the queue
        </Link>
      </Card>
    </main>
  );
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const teacherId = session?.user?.id;
  if (!teacherId) redirect("/login");

  await releaseExpiredClaims();

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      mediaUrl: true,
      mediaKind: true,
      durationSec: true,
      claimedById: true,
      claimedAt: true,
      createdAt: true,
      retryOfId: true,
      student: { select: { publicId: true } },
      exercise: { select: { title: true, prompt: true, module: { select: { level: true } } } },
      word: { select: { text: true, kind: true, details: true } },
    },
  });
  if (!submission) notFound();

  const studentId = displayId(submission.student.publicId);

  if (submission.status === "PENDING") {
    return (
      <Notice title={submission.exercise.title}>
        <p>
          {studentId} · waiting since {submission.createdAt.toLocaleString("en-IN")}. Claim it to
          start — it is held for you for {CLAIM_MINUTES} minutes.
        </p>
        <div className="mt-4 flex justify-start">
          <ClaimButton submissionId={submission.id} label="Claim and start" />
        </div>
      </Notice>
    );
  }

  // Claimed by someone else, or already finished: this teacher must not type
  // an audit that cannot be saved.
  if (submission.claimedById !== teacherId || submission.status !== "IN_REVIEW") {
    return (
      <Notice title="Not available">
        {submission.status === "REVIEWED"
          ? "This submission has already been audited."
          : submission.status === "RETURNED"
            ? "This submission was sent back to the student."
            : "Another teacher is reviewing this one. Pick a different submission."}
      </Notice>
    );
  }

  // A private storage key, signed here so the key never reaches the browser.
  const mediaUrl = await resolveMediaUrl(submission.mediaUrl);

  // A teacher who cannot hear the recording must not be able to score it.
  // Release is offered so the item does not sit locked until the timer ends.
  if (!mediaUrl) {
    return (
      <Notice title="This file could not be opened">
        <p>The recording is missing from storage, so it cannot be reviewed.</p>
        <div className="mt-4">
          <ReleaseButton submissionId={submission.id} redirectTo="/queue" />
        </div>
      </Notice>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">
            <Link href="/queue" className="hover:text-accent">
              ← Queue
            </Link>
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">
            {submission.word ? `Flashcard ${cardNoun(submission.word.kind).toLowerCase()}: ${submission.word.text}` : submission.exercise.title}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <Link
              href={`/students/${submission.student.publicId ?? ""}`}
              className="font-mono text-ink hover:text-accent hover:underline"
            >
              {studentId}
            </Link>
            <Badge variant="accent">Level {submission.exercise.module.level}</Badge>
            {submission.retryOfId ? <Badge>Re-recorded after send-back</Badge> : null}
            <span>· sent {submission.createdAt.toLocaleString("en-IN")}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {submission.claimedAt ? (
            <ClaimTimer
              expiresAt={claimExpiresAt(submission.claimedAt).toISOString()}
              submissionId={submission.id}
              minutes={CLAIM_MINUTES}
            />
          ) : null}
          <ReleaseButton submissionId={submission.id} redirectTo="/queue" />
        </div>
      </div>

      <Card className="mt-5 p-4">
        <CardTitle className="text-sm">What they were asked</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">{submission.exercise.prompt}</p>
        {submission.word ? (
          <p className="mt-2 text-sm text-ink">
            <span className="font-medium">{submission.word.text}</span> — {submission.word.kind === "CHUNK" ? chunkGloss(chunkDetailsOf(submission.word.details)) : detailsOf(submission.word.details).simple_explanation}
          </p>
        ) : null}
      </Card>

      <SendBackForm submissionId={submission.id} />

      <RubricForm
        submissionId={submission.id}
        mediaUrl={mediaUrl}
        mediaKind={submission.mediaKind}
        durationSec={submission.durationSec}
      />
    </main>
  );
}
