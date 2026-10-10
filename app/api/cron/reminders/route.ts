// Owns the daily flashcard reminder email (vercel.json → once a day).
//
// Same guard as the retention cron: Vercel sends "Authorization: Bearer
// <CRON_SECRET>", and without it the route refuses — an open endpoint here is
// a way for anyone to make the site email its students.
//
// It deliberately sends one email per student per run, only to students who
// switched the reminder on AND have cards due. The time is fixed by the cron
// schedule; a per-student time would need an hourly job.

import { NextResponse } from "next/server";

import { appUrl } from "@/lib/appUrl";
import { sendStudyReminder } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Bounded so one run cannot time out; whoever is left gets tomorrow's run.
const MAX_PER_RUN = 200;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      suspendedAt: null,
      email: { not: null },
      preferences: { path: ["emailReminder"], equals: true },
    },
    select: { id: true, email: true },
    take: MAX_PER_RUN,
  });

  const link = `${appUrl(req)}/flashcards`;
  const now = new Date();
  let sent = 0;
  for (const s of students) {
    try {
      const due = await prisma.cardState.count({
        where: { userId: s.id, reviews: { gt: 0 }, dueAt: { lte: now }, word: { deckId: null } },
      });
      if (due > 0 && s.email) {
        await sendStudyReminder(s.email, due, link);
        sent++;
      }
    } catch (err) {
      // One bad address must not stop everyone after them.
      console.error("Reminder not sent", err instanceof Error ? err.message : "unknown error");
    }
  }
  return NextResponse.json({ ok: true, checked: students.length, sent });
}
