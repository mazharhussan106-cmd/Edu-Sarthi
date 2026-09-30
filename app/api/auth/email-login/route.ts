// Owns sending the passwordless sign-in email: a six-digit code and a one-tap
// link, both good for ten minutes.
//
// It deliberately answers the same way whether or not an account exists for
// the address. Sign-in by email also creates the account, so there is nothing
// to hide today — but a different reply per address is the habit that leaks
// who is registered the day that stops being true.

import { NextResponse } from "next/server";

import { issueEmailLogin } from "@/lib/emailLogin";
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

  const { email } = parsed.data;
  const issued = await issueEmailLogin(email);
  if (!issued.ok) {
    return NextResponse.json(
      { error: `Wait ${issued.retryInSec} seconds before asking for another code.` },
      { status: 429 },
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const url = `${origin}/login/link?token=${encodeURIComponent(issued.linkToken)}`;

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
