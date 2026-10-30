// Owns sending the passwordless sign-in email: a six-digit code and a one-tap
// link, both good for ten minutes.
//
// It deliberately answers the same way whether or not an account exists for
// the address. Sign-in by email also creates the account, so there is nothing
// to hide today — but a different reply per address is the habit that leaks
// who is registered the day that stops being true. The staff doors
// (lib/doorAuth) send nothing to an address they do not admit, with the same
// reply.

import { NextResponse } from "next/server";

import { appUrl } from "@/lib/appUrl";

import { staffDoorMaySend } from "@/lib/doorAuth";
import { issueEmailLogin } from "@/lib/emailLogin";
import { PORTAL_PATH } from "@/lib/portals";
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
  // A staff door sends a code only to an account it admits, and answers
  // exactly the same otherwise, so the page reveals nothing about who has an
  // account. The student door sends to anyone: the code makes the account.
  if (!(await staffDoorMaySend(portal, email))) return NextResponse.json({ ok: true });

  const issued = await issueEmailLogin(email);
  if (!issued.ok) {
    return NextResponse.json(
      { error: `Wait ${issued.retryInSec} seconds before asking for another code.` },
      { status: 429 },
    );
  }

  // The link opens the same door, so a staff link checks the same role.
  const door = portal === "student" ? "" : `&portal=${portal}`;
  const url = `${appUrl(req)}${PORTAL_PATH.student}/link?token=${encodeURIComponent(issued.linkToken)}${door}`;

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
