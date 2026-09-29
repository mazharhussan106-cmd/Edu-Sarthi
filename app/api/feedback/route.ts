// Owns every teacher action on a submission: claiming it, releasing or
// extending the claim, sending it back with a reason, and submitting the audit.
//
// Both live here because both are writes against the same row by the same role,
// and splitting them would mean duplicating the claim check in two files.
//
// It deliberately does NOT let a teacher edit an audit after submitting. The
// student may have already read it, and silently rewriting feedback they acted
// on is worse than leaving a mistake visible. Editing needs its own flow.

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { claimSchema, feedbackSchema, holdSchema, returnSchema } from "@/lib/validations";
import { releaseExpiredClaims } from "@/lib/claims";

export async function POST(req: Request) {
  const session = await auth();
  const teacherId = session?.user?.id;

  // Middleware already blocks students from /queue and /review, but this route
  // is reachable directly — a guard that only exists in middleware protects
  // pages, not endpoints.
  if (!teacherId || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "You do not have access to this." }, { status: 403 });
  }
  // The JWT's role is from sign-in time. Re-read it, so a teacher an admin
  // has demoted or suspended cannot keep claiming and auditing on an old token.
  const current = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { role: true, suspendedAt: true },
  });
  if (!current || current.suspendedAt || (current.role !== "TEACHER" && current.role !== "ADMIN")) {
    return NextResponse.json({ error: "You do not have access to this." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const action = (body as { action?: unknown })?.action;

  if (action === "claim") {
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Could not open that submission." }, { status: 400 });
    }

    // A claim that ran out is fair game again before anyone checks PENDING.
    await releaseExpiredClaims();

    // Conditional update, not read-then-write. Two teachers pressing Review at
    // the same moment both pass a read check; only one can match
    // `status: PENDING` in the WHERE clause, and the loser gets count 0.
    const claimed = await prisma.submission.updateMany({
      where: { id: parsed.data.submissionId, status: "PENDING" },
      data: { status: "IN_REVIEW", claimedById: teacherId, claimedAt: new Date() },
    });

    if (claimed.count === 0) {
      // Either someone else took it, or this teacher already has it open in
      // another tab. Distinguish, so the second case is not a dead end.
      const current = await prisma.submission.findUnique({
        where: { id: parsed.data.submissionId },
        select: { status: true, claimedById: true },
      });

      if (current?.claimedById === teacherId) return NextResponse.json({ ok: true });

      return NextResponse.json(
        { error: "Another teacher is already reviewing this one. Pick a different submission." },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "release" || action === "extend") {
    const parsed = holdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Could not update that claim." }, { status: 400 });
    }

    // Scoped to this teacher's own live claim, in the WHERE clause.
    const updated = await prisma.submission.updateMany({
      where: { id: parsed.data.submissionId, claimedById: teacherId, status: "IN_REVIEW" },
      data:
        parsed.data.action === "release"
          ? { status: "PENDING", claimedById: null, claimedAt: null }
          : { claimedAt: new Date() },
    });
    if (updated.count === 0) {
      return NextResponse.json(
        { error: "This submission is no longer yours. Go back to the queue." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, claimedAt: new Date().toISOString() });
  }

  if (action === "return") {
    const parsed = returnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Pick a reason and try again." },
        { status: 400 },
      );
    }

    // Same claim scoping as submitting an audit: only the teacher holding the
    // claim can send it back, and only while it is still in review.
    const returned = await prisma.submission.updateMany({
      where: { id: parsed.data.submissionId, claimedById: teacherId, status: "IN_REVIEW" },
      data: {
        status: "RETURNED",
        returnReason: parsed.data.reason,
        returnNote: parsed.data.note || null,
      },
    });
    if (returned.count === 0) {
      return NextResponse.json(
        { error: "This submission is no longer yours to review. Go back to the queue." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the audit and try again." },
      { status: 400 },
    );
  }

  // `action` is pulled out explicitly. Left inside the spread it reached
  // feedback.create() as an unknown column, and every audit failed to save.
  const { action: _action, submissionId, notes, ...scores } = parsed.data;

  // Scoped by claimedById in the WHERE clause rather than fetched and compared.
  // One round trip, and no window where a mistyped early return writes an audit
  // onto someone else's claim.
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, claimedById: teacherId, status: "IN_REVIEW" },
    select: { id: true, durationSec: true },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "This submission is no longer yours to review. Go back to the queue." },
      { status: 409 },
    );
  }

  // Timestamps are validated here, not only in the schema, because the limit
  // depends on this submission's length — Zod cannot know it.
  if (submission.durationSec !== null) {
    const overrun = notes.find((n) => n.at > submission.durationSec!);
    if (overrun) {
      return NextResponse.json(
        { error: `A note is timed past the end of the recording (${submission.durationSec}s).` },
        { status: 400 },
      );
    }
  }

  // Both writes must land together: an audit saved without flipping the status
  // leaves the submission in the queue forever, and a status flip without an
  // audit shows the student a reviewed submission with nothing in it.
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.feedback.create({
          data: { submissionId, teacherId, notes, ...scores },
        });

        await tx.submission.update({
          where: { id: submissionId },
          data: { status: "REVIEWED" },
        });
      },
      // Prisma's 5s default is too tight against pooler latency and throws
      // P2028 under no real load at all.
      { maxWait: 10_000, timeout: 20_000 },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not save the audit. Your notes are still on screen — try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
