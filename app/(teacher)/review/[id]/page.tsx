// Owns the review screen: it claims the submission, then renders the player
// and the rubric form.
//
// Claiming happens on the server here rather than on a button press, because
// opening the page IS the intent to review — a separate claim button is a step
// a teacher forgets, and two people then type the same audit.

import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayId } from "@/lib/publicId";
import { resolveMediaUrl } from "@/lib/storage";
import { Card, CardTitle } from "@/components/ui/Card";
import { RubricForm } from "@/components/review/RubricForm";
import { SendBackForm } from "@/components/review/SendBackForm";

export const revalidate = 0;

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) redirect("/login");

  // Same conditional-update race guard as the API route: only one caller can
  // match `status: PENDING`.
  await prisma.submission.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "IN_REVIEW", claimedById: teacherId, claimedAt: new Date() },
  });

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      mediaUrl: true,
      mediaKind: true,
      durationSec: true,
      claimedById: true,
      createdAt: true,
      student: { select: { publicId: true } },
      exercise: { select: { title: true, prompt: true } },
    },
  });

  if (!submission) notFound();

  // Claimed by someone else, or already finished. Both mean this teacher
  // should not be typing an audit that cannot be saved.
  if (submission.claimedById !== teacherId || submission.status !== "IN_REVIEW") {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardTitle>Not available</CardTitle>
          <p className="mt-2 text-sm text-ink-muted">
            {submission.status === "REVIEWED"
              ? "This submission has already been reviewed."
              : submission.status === "RETURNED"
              ? "This submission was sent back to the student."
              : "Another teacher is reviewing this one."}{" "}
            Go back to the queue and pick a different submission.
          </p>
        </Card>
      </main>
    );
  }

  // mediaUrl is a private storage key, not a URL. Signed here on the server so
  // the key itself never reaches the browser, and the link expires.
  const mediaUrl = await resolveMediaUrl(submission.mediaUrl);

  // Refusing to render the form is deliberate. A teacher who cannot hear the
  // recording must not be able to submit scores for it.
  if (!mediaUrl) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardTitle>This file could not be opened</CardTitle>
          <p className="mt-2 text-sm text-ink-muted">
            The recording is missing from storage, so it cannot be reviewed.
            Leave it and pick another from the queue — this one needs looking
            at separately.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">
        {submission.exercise.title}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {displayId(submission.student.publicId)} ·{" "}
        {submission.createdAt.toLocaleDateString("en-IN")}
      </p>

      <Card className="mt-6">
        <CardTitle>What they were asked</CardTitle>
        <p className="mt-2 text-sm text-ink-muted">{submission.exercise.prompt}</p>
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
