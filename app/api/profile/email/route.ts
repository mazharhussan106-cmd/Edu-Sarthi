// Owns changing the account's email, in two calls. "start" checks it is really
// the owner and emails a code to the new address. "confirm" checks again, then
// moves the account to the new address.
//
// Being signed in is not enough proof: a phone left unlocked must not let
// someone move the account to an inbox only they read. An account with a
// password gives it; one without gets a second code at its current address.
// Both calls check, because nothing is kept between them.
//
// A change ends every session, this one too, the same as a password change.
// It also cancels reset links still sitting in the old inbox, and unlinks
// Google, so "Continue with Google" follows the new address. Without the
// unlink, the old Google account would keep signing in to this one.
//
// It deliberately does NOT touch a guest; guests add an email through
// app/api/profile/guest-upgrade.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { accountCodeMatches, issueAccountCode, spendAccountCodes } from "@/lib/accountCodes";
import { requireUser } from "@/lib/apiUser";
import { sendEmailChangeCode, sendEmailChanged } from "@/lib/email";
import { clearLoginAttempts, isRateLimited, recordFailedLogin } from "@/lib/loginRateLimit";
import { prisma } from "@/lib/prisma";
import { emailChangeConfirmSchema, emailChangeStartSchema } from "@/lib/validations";

const TAKEN = "That email already has an EduSarthi account. Use a different address.";
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

type Me = { email: string; passwordHash: string | null };

/// The owner check both calls share. Null means it passed.
async function provesOwner(userId: string, me: Me, currentPassword: string | undefined, oldCode: string | undefined | "skip") {
  if (me.passwordHash) {
    if (!currentPassword) return bad("Enter your current password.");
    // Same throttle as sign-in for this address, checked before bcrypt.
    if (await isRateLimited(me.email)) return bad("Too many wrong tries. Wait 15 minutes, then try again.", 429);
    if (!(await bcrypt.compare(currentPassword, me.passwordHash))) {
      await recordFailedLogin(me.email);
      return bad("Your current password is not right. Try again, or sign out and use Forgot password.");
    }
    return null;
  }
  if (oldCode === "skip") return null;
  if (!oldCode) return bad(`Enter the code we sent to ${me.email}.`);
  if (!(await accountCodeMatches("email-old", userId, me.email, oldCode))) {
    await recordFailedLogin(`email-change:${userId}`);
    return bad(`The code sent to ${me.email} is not right, or it has expired. Check the newest email, or start again.`);
  }
  return null;
}

export async function POST(req: Request) {
  const gate = await requireUser({ member: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  let body: { action?: unknown } & Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Something went wrong. Please try again.");
  }

  const row = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true } });
  if (!row?.email) return bad("This account has no email to change. Write to us from the Support page.");
  const me: Me = { email: row.email, passwordHash: row.passwordHash };

  if (body.action === "start") {
    const parsed = emailChangeStartSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Check the new email.");
    const { newEmail, currentPassword } = parsed.data;
    if (newEmail === me.email) return bad("That is already your email.");

    // The old-address code is what this call sends, so it is not asked for.
    const denied = await provesOwner(userId, me, currentPassword, "skip");
    if (denied) return denied;
    if (await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } })) return bad(TAKEN, 409);

    // Every send counts, so one account cannot make the site send mail
    // without end.
    const sendKey = `email-change-send:${userId}`;
    if (await isRateLimited(sendKey)) return bad("Too many codes asked for. Wait 15 minutes, then try again.", 429);
    const issued = await issueAccountCode("email-new", userId, newEmail);
    if (!issued.ok) return bad(`A code was just sent. Wait ${issued.retryInSec} seconds before asking for another.`, 429);
    await recordFailedLogin(sendKey);
    try {
      await sendEmailChangeCode(newEmail, issued.code, "new");
    } catch {
      return bad("We could not send the email. Check the new address and try again in a minute.", 502);
    }

    if (!me.passwordHash) {
      // On cooldown means one went out in the last minute; that one still works.
      const old = await issueAccountCode("email-old", userId, me.email);
      if (old.ok) {
        try {
          await sendEmailChangeCode(me.email, old.code, "old");
        } catch {
          return bad(`We could not send the code to ${me.email}. Try again in a minute.`, 502);
        }
      }
    }
    return NextResponse.json({ ok: true, needsOldCode: !me.passwordHash });
  }

  if (body.action === "confirm") {
    const parsed = emailChangeConfirmSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Check the codes and try again.");
    const { newEmail, newCode, currentPassword, oldCode } = parsed.data;

    const checkKey = `email-change:${userId}`;
    if (await isRateLimited(checkKey)) return bad("Too many wrong codes. Wait 15 minutes, then start again.", 429);
    const denied = await provesOwner(userId, me, currentPassword, oldCode);
    if (denied) return denied;
    // Both checked before either is spent, so one wrong code costs nothing.
    if (!(await accountCodeMatches("email-new", userId, newEmail, newCode))) {
      await recordFailedLogin(checkKey);
      return bad(`The code sent to ${newEmail} is not right, or it has expired. Check the newest email, or ask for a new code.`);
    }

    const now = new Date();
    try {
      // Together or not at all: an email moved without the Google unlink would
      // leave the old Google account signing in here.
      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { email: newEmail, emailVerified: now, sessionsValidFrom: now } }),
        prisma.account.deleteMany({ where: { userId, provider: "google" } }),
        prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } }),
      ]);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return bad(TAKEN, 409);
      throw e;
    }

    // After the change and never fatal: the codes expire on their own, the
    // throttle heals as its window slides, and the email is a courtesy.
    try {
      await Promise.all([spendAccountCodes("email-new", userId), spendAccountCodes("email-old", userId), clearLoginAttempts(checkKey)]);
    } catch {
      console.error("Could not clean up after an email change");
    }
    try {
      await sendEmailChanged(me.email, newEmail);
    } catch (err) {
      console.error("Email-changed notice not sent", err instanceof Error ? err.message : "unknown error");
    }
    return NextResponse.json({ ok: true });
  }

  return bad("Something went wrong. Reload the page and try again.");
}
