// Owns creating the Submission row once a file is actually in storage.
//
// It deliberately re-derives the key's owner rather than trusting the client.
// The upload route namespaces keys by user id, so a key that does not start
// with this user's id was not issued to them — and without that check a
// student could point a submission at another student's recording.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { practiceWord } from "@/lib/decks";
import { submissionSchema } from "@/lib/validations";
import { ALLOWED_TYPES, objectExists, isOwnKey } from "@/lib/storage";

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Could not save your submission." },
      { status: 400 },
    );
  }

  const { exerciseId, key, contentType, durationSec, retryOfId, wordId } = parsed.data;

  // Built-in words, or a card on a verified teacher's published deck. The
  // latter is routed to that teacher alone (assignedTeacherId below).
  const target = wordId ? await practiceWord({ id: wordId }) : null;
  if (wordId && !target) {
    return NextResponse.json({ error: "That flashcard is not available for recording. Go back and open it again." }, { status: 400 });
  }

  // The one check that matters. buildKey() writes `${userId}/uuid-name`, so
  // anything else is a key this user was never given.
  if (!isOwnKey(userId, key)) {
    return NextResponse.json({ error: "That file does not belong to you." }, { status: 403 });
  }

  const kind = ALLOWED_TYPES[contentType];
  if (!kind) {
    return NextResponse.json({ error: "That file type is not supported." }, { status: 400 });
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { expects: true, minSeconds: true, maxSeconds: true },
  });

  if (!exercise) {
    return NextResponse.json({ error: "That exercise no longer exists." }, { status: 404 });
  }

  if (exercise.expects !== kind) {
    return NextResponse.json(
      { error: `This exercise expects ${exercise.expects.toLowerCase()}.` },
      { status: 400 },
    );
  }

  // Duration comes from the browser reading the file's metadata, so it can be
  // wrong or absent — treated as guidance, not gospel. A recording that is far
  // too short is rejected because it wastes a teacher's slot; one that is over
  // is let through, since a student who spoke for too long still said
  // something worth auditing.
  if (kind !== "IMAGE" && exercise.minSeconds && durationSec !== null) {
    if (durationSec < exercise.minSeconds * 0.5) {
      return NextResponse.json(
        {
          error: `That clip is ${Math.round(durationSec)}s. This exercise asks for at least ${exercise.minSeconds}s — record a longer one.`,
        },
        { status: 400 },
      );
    }
  }

  // A replacement must point at this student's own sent-back attempt at the
  // same exercise. Anything else is either a bug or someone probing ids.
  if (retryOfId) {
    const original = await prisma.submission.findFirst({
      where: { id: retryOfId, studentId: userId, exerciseId, status: "RETURNED" },
      select: { id: true, retry: { select: { id: true } } },
    });
    if (!original) {
      return NextResponse.json(
        { error: "That attempt cannot be replaced. Open it again from My Audits." },
        { status: 400 },
      );
    }
    if (original.retry) {
      return NextResponse.json(
        { error: "You already sent a new recording for this one. It is in My Audits." },
        { status: 409 },
      );
    }
  }

  // Last, because it is the only check that calls storage. A key that was
  // issued but never written would otherwise become a queue item no teacher
  // can play — and, before this check, one no teacher could ever release.
  if (!(await objectExists(key))) {
    return NextResponse.json(
      { error: "The upload did not reach our storage. Press Send again — your recording is still here." },
      { status: 409 },
    );
  }

  // The same recording sent twice (a double tap, a phone retry) or two
  // simultaneous replacements for one send-back would otherwise end in a bare
  // 500 from the database's unique rule on retryOfId.
  if (!retryOfId && (await prisma.submission.findFirst({ where: { studentId: userId, mediaUrl: key }, select: { id: true } }))) {
    return NextResponse.json({ error: "That recording was already sent. Open My Audits to see it." }, { status: 409 });
  }
  let submission: { id: string };
  try {
    submission = await prisma.submission.create({
      data: {
        studentId: userId,
        exerciseId,
        retryOfId: retryOfId ?? null,
        wordId: wordId ?? null,
        assignedTeacherId: target?.teacherId ?? null,
        mediaUrl: key,
        mediaKind: kind,
        durationSec: kind === "IMAGE" ? null : durationSec,
        status: "PENDING",
      },
      select: { id: true },
    });
  } catch {
    return NextResponse.json({ error: "We could not save your submission. Check My Audits to see if it went through, and send it again if not." }, { status: 409 });
  }

  return NextResponse.json({ ok: true, id: submission.id }, { status: 201 });
}
