// Owns creating the Submission row once a file is actually in storage.
//
// It deliberately re-derives the key's owner rather than trusting the client.
// The upload route namespaces keys by user id, so a key that does not start
// with this user's id was not issued to them — and without that check a
// student could point a submission at another student's recording.

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submissionSchema } from "@/lib/validations";
import { ALLOWED_TYPES } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "Your session has expired. Sign in and try again." },
      { status: 401 },
    );
  }

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

  const { exerciseId, key, contentType, durationSec } = parsed.data;

  // The one check that matters. buildKey() writes `${userId}/uuid-name`, so
  // anything else is a key this user was never given.
  if (!key.startsWith(`${userId}/`)) {
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

  const submission = await prisma.submission.create({
    data: {
      studentId: userId,
      exerciseId,
      mediaUrl: key,
      mediaKind: kind,
      durationSec: kind === "IMAGE" ? null : durationSec,
      status: "PENDING",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: submission.id }, { status: 201 });
}
