// Owns both halves of email verification: checking a submitted code, and
// resending one. Two actions in one route because they share the session
// lookup and always appear on the same page.
//
// It deliberately does NOT take a userId from the body. The user is whoever
// the session says they are — accepting an id would let anyone verify anyone.

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyCodeSchema } from "@/lib/validations";
import { issueVerificationCode, verifyCode } from "@/lib/verification";
import { isRevoked } from "@/lib/activeUser";
import { sendVerificationCode } from "@/lib/email";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("verify"), code: verifyCodeSchema.shape.code }),
  z.object({ action: z.literal("resend") }),
]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { error: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
  }

  // Same revocation rule as every other route that reads auth() directly.
  const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { sessionsValidFrom: true } });
  if (isRevoked(session.user.loginAt, account?.sessionsValidFrom ?? null)) {
    return NextResponse.json({ error: "You were signed out of all devices. Sign in again." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the 6-digit code from your email." },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  if (parsed.data.action === "resend") {
    const issued = await issueVerificationCode(userId);

    if (!issued.ok) {
      return NextResponse.json(
        { error: `Wait ${issued.retryInSec} seconds before asking for another code.` },
        { status: 429 },
      );
    }

    try {
      await sendVerificationCode(session.user.email, issued.code);
    } catch {
      return NextResponse.json(
        { error: "We could not send the email. Please try again in a minute." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  const result = await verifyCode(userId, parsed.data.code);

  if (!result.ok) {
    // Each message says what to do next, not just what failed.
    const messages = {
      invalid: "That code is not right. Check the email and try again.",
      expired: "That code has expired. Ask for a new one below.",
      "too-many-attempts": "Too many tries. Ask for a new code below.",
    } as const;

    return NextResponse.json({ error: messages[result.reason] }, { status: 400 });
  }

  // Returned so the client can call NextAuth's update() and refresh a JWT that
  // still says unverified — without it, middleware bounces them straight back
  // to /verify after a successful verification.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, role: true },
  });

  return NextResponse.json({
    ok: true,
    emailVerified: user?.emailVerified ?? null,
    role: user?.role ?? "STUDENT",
  });
}
