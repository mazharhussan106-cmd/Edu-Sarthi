// Owns account creation: validate, hash, create the user, issue a verification
// code, send it.
//
// It deliberately does NOT accept a role. Role is not in registerSchema and is
// not read from the body — a client-supplied role means anyone signs up as a
// teacher and reads every student's submissions. Teachers are made by changing
// the row in Supabase.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { issueVerificationCode } from "@/lib/verification";
import { sendVerificationCode } from "@/lib/email";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    // First message only. The client already validates with the same schema,
    // so anything reaching here is either a bypass or a bug, and a full issue
    // dump tells an attacker more than it tells a user.
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your details and try again." },
      { status: 400 },
    );
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try signing in instead." },
      { status: 409 },
    );
  }

  // Cost 12: roughly 100ms per hash on Vercel's hardware. High enough that
  // offline cracking of a leaked table is expensive, low enough that a real
  // signup does not time out.
  const passwordHash = await bcrypt.hash(password, 12);

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone ? phone : null,
        // Not set. The account exists but middleware holds it at /verify until
        // the code is entered.
        emailVerified: null,
      },
      select: { id: true },
    });
    userId = user.id;
  } catch {
    // Almost always the unique constraint on email or phone losing a race with
    // a simultaneous signup.
    return NextResponse.json(
      { error: "Could not create the account. Please try again." },
      { status: 409 },
    );
  }

  // Outside any transaction on purpose: sending mail is a network call to a
  // third party, and holding a database transaction open across it is how you
  // get P2028 when SendGrid is slow.
  const issued = await issueVerificationCode(userId);

  if (issued.ok) {
    try {
      await sendVerificationCode(email, issued.code);
    } catch {
      // The account is real and the code is stored — the user can resend from
      // /verify. Failing the whole signup here would leave them with an
      // account they were told does not exist.
      console.error("Verification email failed to send for a new signup");
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
