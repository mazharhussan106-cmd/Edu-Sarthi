// Owns the scheduled run of the retention purge (vercel.json → daily).
//
// Vercel Cron calls it with "Authorization: Bearer <CRON_SECRET>". Without
// that header, or with CRON_SECRET unset, it refuses — an open purge endpoint
// is a delete-everything button on the internet.

import { NextResponse } from "next/server";

import { sweepHelpLog } from "@/lib/aiHelpLimits";
import { sweepSources } from "@/lib/aiSources";
import { sweepNotifications } from "@/lib/notifications";
import { purgeBatch, sweepExpiredAuthRows } from "@/lib/retention";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }
  let total = 0;
  // Bounded: ten batches is 5,000 files per run, and tomorrow's run continues.
  for (let i = 0; i < 10; i++) {
    const n = await purgeBatch(null);
    total += n;
    if (n === 0) break;
  }
  const swept = await sweepExpiredAuthRows();
  // PDFs and photos added for the AI card maker that nobody finished with.
  const sources = await sweepSources();
  // Inbox rows past the owner's limits: read after 90 days, unread after 180.
  const notifications = await sweepNotifications();
  // Help-chatbot counts: only today's are ever read.
  const helpLog = await sweepHelpLog();
  return NextResponse.json({ ok: true, purged: total, swept, sources, notifications, helpLog });
}
