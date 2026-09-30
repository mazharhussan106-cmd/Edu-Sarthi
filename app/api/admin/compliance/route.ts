// Owns the admin's manual "purge now" for the retention policy. Same batch as
// the daily cron, recorded under the admin's name.

import { NextResponse } from "next/server";
import { z } from "zod";

import { readBody, requireAdmin } from "@/lib/admin";
import { purgeBatch } from "@/lib/retention";

const schema = z.object({ action: z.literal("purge") });

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  if (!schema.safeParse(await readBody(req)).success) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  const purged = await purgeBatch(admin.id);
  return NextResponse.json({ ok: true, purged });
}
