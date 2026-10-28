// Owns changing the password from Settings → Security, for an account that
// already has one.
//
// It asks for the current password even though the person is signed in. A
// phone left unlocked, or a session stolen some other way, must not be enough
// to take the account over for good by setting a password only the thief knows.
// For the same reason an account with no password (email code or Google) is
// sent to Forgot password, which proves the inbox, rather than allowed to set
// one here.
//
// Wrong guesses count against the sign-in throttle for the same address, so
// this form is not a second, unthrottled place to try passwords.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireUser } from "@/lib/apiUser";
import { clearLoginAttempts, isRateLimited, recordFailedLogin } from "@/lib/loginRateLimit";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const gate = await requireUser({ member: true });
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the passwords and try again." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: gate.id }, select: { email: true, passwordHash: true } });
  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "This account has no password yet. Sign out, then use Forgot password on the sign-in page to set one." },
      { status: 400 },
    );
  }

  // An account with a password always has an email, but the throttle needs a
  // key either way.
  const throttleKey = user.email ?? gate.id;
  // Before bcrypt, which is slow on purpose and must not be free to trigger.
  if (await isRateLimited(throttleKey)) {
    return NextResponse.json({ error: "Too many wrong tries. Wait 15 minutes, then try again." }, { status: 429 });
  }

  const { currentPassword, password } = parsed.data;
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    await recordFailedLogin(throttleKey);
    return NextResponse.json(
      { error: "Your current password is not right. Try again, or sign out and use Forgot password." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // Ends every session, this one too, the same as a reset: whoever else may
  // have been signed in with the old password is out from this moment.
  await prisma.user.update({ where: { id: gate.id }, data: { passwordHash, sessionsValidFrom: new Date() } });

  // Outside the write: the throttle self-heals as its window slides, so a
  // failure here costs a wait, not the new password.
  try {
    await clearLoginAttempts(throttleKey);
  } catch {
    console.error("Could not clear login attempts after a password change");
  }

  return NextResponse.json({ ok: true });
}
