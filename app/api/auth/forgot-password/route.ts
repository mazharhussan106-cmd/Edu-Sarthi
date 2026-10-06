// Owns issuing a password reset link.
//
// It deliberately returns the same response whether or not the address has an
// account. This is the one place enumeration matters most: the form is public,
// unauthenticated, and can be scripted against a list of addresses.

import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

import { appUrl } from "@/lib/appUrl";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendPasswordResetLink } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000;

// Identical wording for both paths. Timing differs slightly because the real
// path sends an email — acceptable, since the difference is noise next to
// network latency, and closing it fully would mean queueing every request.
const GENERIC = {
  ok: true,
  message: "If that email has an account, a reset link is on its way.",
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return NextResponse.json(GENERIC);

  // One reset email a minute per account. Without it anyone can POST this
  // endpoint in a loop and bury a stranger's inbox. The answer is the same
  // neutral one, so it does not reveal that the account exists.
  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
    select: { id: true },
  });
  if (recent) return NextResponse.json(GENERIC);

  // 32 random bytes, hex. The raw token exists only in the email; the database
  // stores its hash, so a database dump cannot be replayed into account takeover.
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  // Older unused tokens are burned, so a link from an earlier request cannot
  // still be used after a newer one is issued.
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const url = `${appUrl(req)}/reset-password/${token}`;

  try {
    await sendPasswordResetLink(email, url);
  } catch {
    // Never log the URL — a live reset link in a production log reaches
    // further than you think. lib/email.ts throws rather than printing it.
    console.error("Password reset email failed to send");
  }

  return NextResponse.json(GENERIC);
}
