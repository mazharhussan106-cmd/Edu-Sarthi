// Owns issuing a signed upload URL. Validates first, signs second — once a URL
// exists the client can send whatever it likes up to the bucket's own limits,
// so every decision has to be made before it is handed over.
//
// It deliberately does NOT create the Submission row. The upload may fail
// halfway, and a row pointing at a key that was never written is worse than no
// row: it shows a student a submission that will not play.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { uploadUrlSchema } from "@/lib/validations";
import { ALLOWED_TYPES, createUploadTarget, MAX_UPLOAD_BYTES } from "@/lib/storage";

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

  const parsed = uploadUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Could not start the upload." },
      { status: 400 },
    );
  }

  const { filename, contentType, sizeBytes, exerciseId } = parsed.data;

  const kind = ALLOWED_TYPES[contentType];
  if (!kind) {
    return NextResponse.json(
      { error: "That file type is not supported. Send audio, video or an image." },
      { status: 400 },
    );
  }

  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "That file is over 100 MB. Record a shorter clip or compress it first." },
      { status: 400 },
    );
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { expects: true },
  });

  if (!exercise) {
    return NextResponse.json({ error: "That exercise no longer exists." }, { status: 404 });
  }

  // Checked here rather than only in the UI. The exercise decides what it
  // wants; a photo sent to a speaking exercise wastes a teacher's slot in the
  // queue before anyone notices.
  if (exercise.expects !== kind) {
    return NextResponse.json(
      { error: `This exercise expects ${exercise.expects.toLowerCase()}, not ${kind.toLowerCase()}.` },
      { status: 400 },
    );
  }

  try {
    const target = await createUploadTarget(userId, filename);
    return NextResponse.json(target);
  } catch {
    // The real cause is almost always a missing service-role key or a bucket
    // that does not exist — neither is something the student can act on.
    console.error("Could not create a signed upload URL");
    return NextResponse.json(
      { error: "Uploads are unavailable right now. Please try again shortly." },
      { status: 503 },
    );
  }
}
