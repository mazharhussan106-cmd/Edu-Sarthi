// Owns the daily flashcard reminder email (vercel.json → once a day).
//
// Same guard as the retention cron: Vercel sends "Authorization: Bearer
// <CRON_SECRET>", and without it the route refuses — an open endpoint here is
// a way for anyone to make the site email its students.
//
// It deliberately sends one email per student per run, only to students who
// switched the reminder on AND have cards due. The time is fixed by the cron
// schedule; a per-student time would need an hourly job.
//
// It walks the opted-in students in pages ordered by id, and stops at a time
// budget rather than a head-count, so a long list is finished in one run when
// there is time and never starves the same students every day.

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { appUrl } from "@/lib/appUrl";
import { sendStudyReminder } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = 100;
const BUDGET_MS = 45_000;

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization") ?? "";
  if (!secret) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(`Bearer ${secret}`);
  // timingSafeEqual throws on unequal lengths, so length is compared first.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: "Not allowed." }, { status: 401 });

  const started = Date.now();
  const link = `${appUrl(req)}/flashcards`;
  const now = new Date();
  let checked = 0;
  let sent = 0;
  let cursor: string | undefined;

  while (Date.now() - started < BUDGET_MS) {
    const page = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        suspendedAt: null,
        email: { not: null },
        // An unproven address may belong to someone else; never mail it.
        emailVerified: { not: null },
        preferences: { path: ["emailReminder"], equals: true },
      },
      orderBy: { id: "asc" },
      take: PAGE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, email: true },
    });
    if (page.length === 0) break;
    cursor = page[page.length - 1].id;
    checked += page.length;

    // One grouped count for the whole page instead of one query per student.
    const due = await prisma.cardState.groupBy({
      by: ["userId"],
      where: { userId: { in: page.map((s) => s.id) }, reviews: { gt: 0 }, dueAt: { lte: now }, word: { deckId: null } },
      _count: true,
    });
    const dueBy = new Map(due.map((d) => [d.userId, d._count]));

    for (const s of page) {
      const n = dueBy.get(s.id) ?? 0;
      if (n === 0 || !s.email) continue;
      try {
        await sendStudyReminder(s.email, n, link);
        sent++;
      } catch (err) {
        // One bad address must not stop everyone after them.
        console.error("Reminder not sent", err instanceof Error ? err.message : "unknown error");
      }
    }
  }
  return NextResponse.json({ ok: true, checked, sent });
}
