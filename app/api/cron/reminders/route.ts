// Owns the main daily emails (vercel.json, around 7 pm IST): first today's
// batch of an announcement, if one is sending (lib/announcements, at most 80 a
// day), then the teachers' queue email (lib/queueDigest), then the flashcard
// reminders for students who chose 7 pm (lib/studyReminders). Reminders at the
// other times have their own daily jobs (./[hour]).
//
// Refuses anyone but the scheduler (lib/cronAuth).

import { NextResponse } from "next/server";

import { appUrl } from "@/lib/appUrl";
import { sendAnnouncementBatch } from "@/lib/announcements";
import { cronAuthorised } from "@/lib/cronAuth";
import { sendQueueDigests } from "@/lib/queueDigest";
import { MAIN_REMINDER_HOUR } from "@/lib/reminderTimes";
import { sendStudyReminders } from "@/lib/studyReminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUDGET_MS = 45_000;
/// The announcement goes first, inside the same function time: a promised
/// notice matters more than a nudge, and 80 emails need far less than this.
const ANNOUNCEMENT_BUDGET_MS = 20_000;

export async function GET(req: Request) {
  if (!cronAuthorised(req)) return NextResponse.json({ error: "Not allowed." }, { status: 401 });

  const started = Date.now();
  // Its own failure must not stop the reminders; the next run carries on.
  const announcement = await sendAnnouncementBatch(ANNOUNCEMENT_BUDGET_MS).catch((err) => {
    console.error("Announcement batch failed", err instanceof Error ? err.message : "unknown error");
    return { sent: 0, failed: 0 };
  });
  // Before the students: a few emails, and a recording past its deadline costs
  // a student more than a late nudge does. Its failure must not stop them.
  const queue = await sendQueueDigests(`${appUrl(req)}/queue`).catch((err) => {
    console.error("Queue emails failed", err instanceof Error ? err.message : "unknown error");
    return { sent: 0, failed: 0 };
  });
  const { checked, sent } = await sendStudyReminders(MAIN_REMINDER_HOUR, `${appUrl(req)}/flashcards`, started + BUDGET_MS);
  return NextResponse.json({ ok: true, checked, sent, announcement, queue });
}
