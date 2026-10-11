// Owns posting and removing student notices. Admins only, every change written
// to the admin log.
//
// It deliberately has no edit. A wrong notice is deleted and posted again,
// which keeps the log honest about what students were shown and when.

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { logAdmin, readBody, requireAdmin } from "@/lib/admin";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    title: z.string().trim().min(3, "Give the notice a title of at least 3 letters.").max(120),
    body: z.string().trim().min(3, "Write what students need to know.").max(1000),
    eventAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  }),
  z.object({ action: z.literal("delete"), id: z.string().min(1) }),
]);

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const parsed = schema.safeParse(await readBody(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the notice and try again." }, { status: 400 });
  }
  const a = parsed.data;

  if (a.action === "delete") {
    const { count } = await prisma.notice.deleteMany({ where: { id: a.id } });
    if (!count) return NextResponse.json({ error: "That notice is already gone. Refresh the page." }, { status: 404 });
    await logAdmin(admin.id, "Deleted notice", "notice", a.id);
    return NextResponse.json({ ok: true });
  }

  const eventAt = a.eventAt ? new Date(a.eventAt) : null;
  const expiresAt = a.expiresAt ? new Date(a.expiresAt) : null;
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "The hide-after time is already past. Pick a later time." }, { status: 400 });
  }
  const notice = await prisma.notice.create({
    data: { title: a.title, body: a.body, eventAt, expiresAt, createdById: admin.id },
    select: { id: true },
  });
  await logAdmin(admin.id, "Posted notice", "notice", notice.id, { title: a.title });
  return NextResponse.json({ ok: true, id: notice.id });
}
