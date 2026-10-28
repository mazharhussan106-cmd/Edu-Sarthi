// Owns the flashcard reminders for one of the times other than 7 pm: each
// time has its own daily job in vercel.json (/api/cron/reminders/7, /9 …),
// because Vercel's Hobby plan runs a cron job at most once a day.
//
// It refuses the main hour, which /api/cron/reminders already sends, so a
// mistaken extra job cannot email the 7 pm students twice. It deliberately
// sends nothing else: announcements and the teachers' queue email stay with
// the main daily job.

import { NextResponse } from "next/server";

import { appUrl } from "@/lib/appUrl";
import { cronAuthorised } from "@/lib/cronAuth";
import { isReminderHour, MAIN_REMINDER_HOUR } from "@/lib/reminderTimes";
import { sendStudyReminders } from "@/lib/studyReminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUDGET_MS = 45_000;

export async function GET(req: Request, { params }: { params: Promise<{ hour: string }> }) {
  if (!cronAuthorised(req)) return NextResponse.json({ error: "Not allowed." }, { status: 401 });

  const hour = Number((await params).hour);
  if (!isReminderHour(hour) || hour === MAIN_REMINDER_HOUR) {
    return NextResponse.json({ error: "Not a reminder time with its own job." }, { status: 404 });
  }

  const { checked, sent } = await sendStudyReminders(hour, `${appUrl(req)}/flashcards`, Date.now() + BUDGET_MS);
  return NextResponse.json({ ok: true, hour, checked, sent });
}
