// Owns the admin's announcement actions: write a draft, email a test to
// themselves, start sending, stop, and delete a draft. The rules and the admin
// log entries are in lib/announcements; this checks the caller and the input.
//
// It deliberately does NOT send to everyone itself: the daily cron does, at
// most 80 a day, so pressing Start never blocks on hundreds of emails.

import { NextResponse } from "next/server";

import { readBody, requireAdmin } from "@/lib/admin";
import { createAnnouncement, deleteDraft, sendTest, startAnnouncement, stopAnnouncement } from "@/lib/announcements";
import { announcementActionSchema } from "@/lib/announcementSchemas";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const parsed = announcementActionSchema.safeParse(await readBody(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });
  const a = parsed.data;
  const res =
    a.action === "create" ? await createAnnouncement(admin.id, { subject: a.subject, body: a.body, notice: a.notice })
    : a.action === "delete" ? await deleteDraft(admin.id, a.id)
    : a.action === "test" ? await sendTest(admin.id, a.id)
    : a.action === "start" ? await startAnnouncement(admin.id, a.id)
    : await stopAnnouncement(admin.id, a.id);
  return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ ok: true });
}
