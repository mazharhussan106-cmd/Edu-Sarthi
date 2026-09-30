// Owns admin actions on accounts (spec A-04): change a role, suspend, and
// lift a suspension. Each takes a reason, and each is logged.
//
// Two guards stop an admin locking everyone out: nobody can change their own
// role or suspend themselves, and the last active admin cannot be demoted.
//
// Credit adjustments from the spec are absent; wallets arrive with payments.

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { logAdmin, readBody, requireAdmin } from "@/lib/admin";
import { generatePublicId } from "@/lib/publicId";

const reason = z.string().trim().min(3, "Give a reason — it goes in the admin log").max(300);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("role"), userId: z.string().min(1), role: z.enum(["STUDENT", "TEACHER", "ADMIN"]), reason }),
  z.object({ action: z.literal("suspend"), userId: z.string().min(1), reason }),
  z.object({ action: z.literal("unsuspend"), userId: z.string().min(1), reason }),
]);

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const parsed = schema.safeParse(await readBody(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the request." }, { status: 400 });
  }
  const a = parsed.data;
  if (a.userId === admin.id) {
    return NextResponse.json({ error: "You cannot change your own account. Ask another admin." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: a.userId },
    select: { id: true, role: true, email: true, publicId: true, suspendedAt: true },
  });
  if (!target) return NextResponse.json({ error: "That account no longer exists." }, { status: 404 });

  const losesAdmin = target.role === "ADMIN" && !target.suspendedAt && (a.action === "suspend" || (a.action === "role" && a.role !== "ADMIN"));
  if (losesAdmin) {
    const admins = await prisma.user.count({ where: { role: "ADMIN", suspendedAt: null } });
    if (admins <= 1) {
      return NextResponse.json({ error: "This is the last active admin. Make someone else an admin first." }, { status: 409 });
    }
  }

  if (a.action === "role") {
    if (a.role === target.role) return NextResponse.json({ ok: true });
    await prisma.user.update({
      where: { id: target.id },
      // A student-facing ID is needed if the account is (or becomes) a
      // student, and older rows may not have one yet.
      data: { role: a.role, publicId: target.publicId ?? generatePublicId() },
    });
    await logAdmin(admin.id, `Changed role ${target.role} → ${a.role}`, "user", target.id, { email: target.email, reason: a.reason });
    return NextResponse.json({ ok: true });
  }

  await prisma.user.update({
    where: { id: target.id },
    data:
      a.action === "suspend"
        ? { suspendedAt: new Date(), suspendReason: a.reason }
        : { suspendedAt: null, suspendReason: null },
  });
  if (a.action === "suspend") {
    // A suspended teacher's open claims go straight back to the queue rather
    // than sitting locked for half an hour.
    await prisma.submission.updateMany({
      where: { claimedById: target.id, status: "IN_REVIEW" },
      data: { status: "PENDING", claimedById: null, claimedAt: null },
    });
  }
  await logAdmin(
    admin.id,
    a.action === "suspend" ? "Suspended account" : "Lifted suspension",
    "user",
    target.id,
    { email: target.email, reason: a.reason },
  );
  return NextResponse.json({ ok: true });
}
