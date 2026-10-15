// Owns the one question every writing API route must ask first: who is this,
// and are they still allowed? It reads the account from the database, not the
// token — a token outlives a suspension, a role change or a deleted account for
// as long as the session lasts, and middleware does not cover /api at all.
//
// `verified: true` also refuses an account whose email is not proven yet, so an
// unverified (or junk-address) signup cannot fill the teacher queue, publish
// decks or send reports. It deliberately does NOT check roles — each route
// decides which roles it allows — and it never reveals why beyond what the
// person can act on.

import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

import { isRevoked } from "@/lib/activeUser";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Gate = { ok: true; id: string; role: Role } | { ok: false; res: NextResponse };

export async function requireUser(opts: { verified?: boolean } = {}): Promise<Gate> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) {
    return { ok: false, res: NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 }) };
  }
  const row = await prisma.user.findUnique({ where: { id }, select: { role: true, suspendedAt: true, emailVerified: true, sessionsValidFrom: true } });
  // A deleted account and a suspended one get the same answer.
  if (!row || row.suspendedAt) {
    return { ok: false, res: NextResponse.json({ error: "This account cannot do that right now. Contact support from the Support page." }, { status: 403 }) };
  }
  if (isRevoked(session?.user?.loginAt, row.sessionsValidFrom)) {
    return { ok: false, res: NextResponse.json({ error: "You were signed out of all devices. Sign in again." }, { status: 401 }) };
  }
  if (opts.verified && !row.emailVerified) {
    return { ok: false, res: NextResponse.json({ error: "Verify your email first. Open the verification page and enter the code we sent you." }, { status: 403 }) };
  }
  return { ok: true, id, role: row.role };
}
