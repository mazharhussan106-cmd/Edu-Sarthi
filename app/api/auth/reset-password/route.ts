// Owns consuming a reset token and setting the new password.
//
// It deliberately does NOT sign the user in afterwards. Whoever has the link
// may not be the account owner, and handing them a session on the strength of
// one email would skip the password they just set.

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { clearLoginAttempts } from "@/lib/loginRateLimit";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your details and try again." },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: { select: { email: true } },
    },
  });

  // One message for missing, used and expired. Distinguishing them would let
  // someone with a stolen link learn whether it was ever valid.
  const INVALID = "This reset link is no longer valid. Request a new one.";

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: INVALID }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Both writes must land together: a password changed without burning the
  // token leaves a working link that can change it again.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // Outside the transaction: the throttle self-heals as the 15-minute window
  // slides, so a failure here costs the user a wait, not their account.
  if (record.user.email) {
    try {
      await clearLoginAttempts(record.user.email);
    } catch {
      console.error("Could not clear login attempts after a password reset");
    }
  }

  return NextResponse.json({ ok: true });
}
