// Owns the scheduled run of the retention purge (vercel.json → daily).
//
// Vercel Cron calls it with "Authorization: Bearer <CRON_SECRET>". Without
// that header, or with CRON_SECRET unset, it refuses — an open purge endpoint
// is a delete-everything button on the internet.

import { NextResponse } from "next/server";

import { purgeBatch } from "@/lib/retention";

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
  return NextResponse.json({ ok: true, purged: total });
}
