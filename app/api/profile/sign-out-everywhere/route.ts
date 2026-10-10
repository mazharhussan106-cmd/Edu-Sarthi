// Owns "sign out of all devices": stamps the account with the current time, and
// every session signed in before that moment is refused at its next page load
// or API call (lib/activeUser, lib/apiUser).
//
// It deliberately revokes by time rather than keeping a list of sessions. The
// app uses JWTs, so there is no session table to delete rows from, and a
// timestamp is one column and one comparison.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;

  await prisma.user.update({ where: { id: gate.id }, data: { sessionsValidFrom: new Date() } });
  return NextResponse.json({ ok: true });
}
