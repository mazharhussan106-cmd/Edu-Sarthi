// Owns sending the passwordless sign-in email: a six-digit code and a one-tap
// link, both good for ten minutes.
//
// It deliberately answers the same way whether or not an account exists for
// the address. On the student door sign-in also creates the account, so there
// is nothing to hide there — but the teacher and admin doors only admit
// existing accounts, and a different reply per address would leak who has one.

import { NextResponse } from "next/server";

import { appUrl } from "@/lib/appUrl";

import { issueEmailLogin } from "@/lib/emailLogin";
import { PORTAL_ROLE } from "@/lib/portals";
import { prisma } from "@/lib/prisma";
import { sendLoginEmail } from "@/lib/email";
import { emailLoginRequestSchema } from "@/lib/validations";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const parsed = emailLoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 400 },
    );
  }

  const { email, portal } = parsed.data;

  // The student door creates accounts, so it always sends. The teacher and
  // admin doors only send to an account that could use them, and answer the
  // same either way — "no such teacher here" would confirm who is registered,
  // and an admin address must not be probe-able from the public internet.
  if (portal !== "student") {
    const account = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    const admitted =
      portal === "admin" ? account?.role === PORTAL_ROLE.admin : account !== null;
    if (!admitted) return NextResponse.json({ ok: true });
  }

  const issued = await issueEmailLogin(email);
  if (!issued.ok) {
    return NextResponse.json(
      { error: `Wait ${issued.retryInSec} seconds before asking for another code.` },
      { status: 429 },
    );
  }

  const url = `${appUrl(req)}/login/link?token=${encodeURIComponent(issued.linkToken)}&portal=${portal}`;

  try {
    await sendLoginEmail(email, issued.code, url);
  } catch {
    return NextResponse.json(
      { error: "We could not send the email. Please try again in a minute." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
