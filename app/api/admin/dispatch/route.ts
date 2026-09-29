// Owns admin actions on the review pipeline (spec A-02): reassign a submission
// to a teacher, force-unlock a stuck claim, and flag or unflag a finished audit
// for a quality check. Every action is written to the admin log.
//
// Each write is a conditional update on the status it expects, like the
// teacher routes, so an admin acting on a stale screen cannot, say, unlock a
// submission that was audited a second ago.

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { logAdmin, readBody, requireAdmin } from "@/lib/admin";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reassign"), submissionId: z.string().min(1), teacherId: z.string().min(1) }),
  z.object({ action: z.literal("unlock"), submissionId: z.string().min(1) }),
  z.object({ action: z.literal("qa"), submissionId: z.string().min(1), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("unqa"), submissionId: z.string().min(1) }),
]);

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const parsed = schema.safeParse(await readBody(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the request." }, { status: 400 });
  }
  const a = parsed.data;

  if (a.action === "reassign") {
    const teacher = await prisma.user.findFirst({
      where: { id: a.teacherId, role: { in: ["TEACHER", "ADMIN"] }, suspendedAt: null },
      select: { id: true, email: true },
    });
    if (!teacher) return NextResponse.json({ error: "Pick an active teacher." }, { status: 400 });

    // Fresh claim: the new teacher gets a full 30 minutes from now.
    const { count } = await prisma.submission.updateMany({
      where: { id: a.submissionId, status: { in: ["PENDING", "IN_REVIEW"] } },
      data: { status: "IN_REVIEW", claimedById: teacher.id, claimedAt: new Date() },
    });
    if (!count) return NextResponse.json({ error: "It was audited or sent back meanwhile. Refresh." }, { status: 409 });
    await logAdmin(admin.id, "Reassigned submission", "submission", a.submissionId, { to: teacher.email });
    return NextResponse.json({ ok: true });
  }

  if (a.action === "unlock") {
    const { count } = await prisma.submission.updateMany({
      where: { id: a.submissionId, status: "IN_REVIEW" },
      data: { status: "PENDING", claimedById: null, claimedAt: null },
    });
    if (!count) return NextResponse.json({ error: "It is no longer claimed. Refresh." }, { status: 409 });
    await logAdmin(admin.id, "Force-unlocked claim", "submission", a.submissionId);
    return NextResponse.json({ ok: true });
  }

  const { count } = await prisma.feedback.updateMany({
    where: { submissionId: a.submissionId },
    data:
      a.action === "qa"
        ? { qaFlaggedAt: new Date(), qaNote: a.reason }
        : { qaFlaggedAt: null, qaNote: null },
  });
  if (!count) return NextResponse.json({ error: "That submission has no audit." }, { status: 404 });
  await logAdmin(
    admin.id,
    a.action === "qa" ? "Flagged audit for QA" : "Cleared QA flag",
    "submission",
    a.submissionId,
    a.action === "qa" ? { note: a.reason } : undefined,
  );
  return NextResponse.json({ ok: true });
}
