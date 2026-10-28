// Owns turning a guest into a full account without losing anything: the guest
// gives a name and an email, proves the inbox with a code, and the same account
// row gets the email. Cards, history and settings stay, because nothing moves.
//
// "send" emails the code; "verify" checks it and converts the account. Both are
// throttled per guest on the sign-in throttle's table: sending, because anyone
// can make a guest and point the site's mail at any address; checking, because
// a six-digit code is only safe while guessing is slow.
//
// It deliberately does NOT merge a guest into an account that already exists
// for that email. Merging two sets of progress needs rules nobody has decided,
// so that email is refused with a way forward instead.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/apiUser";
import { sendGuestUpgradeCode } from "@/lib/email";
import { issueAccountCode, redeemAccountCode } from "@/lib/accountCodes";
import { clearLoginAttempts, isRateLimited, recordFailedLogin } from "@/lib/loginRateLimit";
import { prisma } from "@/lib/prisma";
import { guestUpgradeSendSchema, guestUpgradeVerifySchema } from "@/lib/validations";

const TAKEN = "That email already has an EduSarthi account. To use it, sign out and sign in with that email. This guest's progress cannot be moved into it.";

export async function POST(req: Request) {
  // Not member: true. Guests are exactly who this is for.
  const gate = await requireUser();
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  let body: { action?: unknown } & Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { isGuest: true } });
  if (!me?.isGuest) {
    return NextResponse.json({ error: "This account already has an email. Reload the page to see your settings." }, { status: 400 });
  }

  if (body.action === "send") {
    const parsed = guestUpgradeSendSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your name and email." }, { status: 400 });
    const { email } = parsed.data;

    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ error: TAKEN }, { status: 409 });
    }
    const sendKey = `guest-upgrade-send:${userId}`;
    if (await isRateLimited(sendKey)) {
      return NextResponse.json({ error: "Too many codes asked for. Wait 15 minutes, then try again." }, { status: 429 });
    }
    const issued = await issueAccountCode("guest-upgrade", userId, email);
    if (!issued.ok) {
      return NextResponse.json({ error: `A code was just sent. Wait ${issued.retryInSec} seconds before asking for another.` }, { status: 429 });
    }
    // Counted on every send that goes out, not only on failures: this caps
    // how much mail one guest can make the site send.
    await recordFailedLogin(sendKey);
    try {
      await sendGuestUpgradeCode(email, issued.code);
    } catch {
      return NextResponse.json({ error: "We could not send the email. Check the address and try again in a minute." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "verify") {
    const parsed = guestUpgradeVerifySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the code and try again." }, { status: 400 });
    const { name, email, code } = parsed.data;

    const checkKey = `guest-upgrade:${userId}`;
    if (await isRateLimited(checkKey)) {
      return NextResponse.json({ error: "Too many wrong codes. Wait 15 minutes, then ask for a new code." }, { status: 429 });
    }
    if (!(await redeemAccountCode("guest-upgrade", userId, email, code))) {
      await recordFailedLogin(checkKey);
      return NextResponse.json({ error: "That code is not right, or it has expired. Check the newest email, or ask for a new code." }, { status: 400 });
    }

    try {
      // isGuest in the WHERE: two tabs confirming at once convert it once.
      const { count } = await prisma.user.updateMany({
        where: { id: userId, isGuest: true },
        data: { email, emailVerified: new Date(), isGuest: false, name },
      });
      if (count === 0) return NextResponse.json({ error: "This account already has an email. Reload the page to see your settings." }, { status: 409 });
    } catch (e) {
      // Someone else took the address between the code and now.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ error: TAKEN }, { status: 409 });
      throw e;
    }

    // Outside the write: the throttle heals on its own as its window slides.
    try {
      await clearLoginAttempts(checkKey);
    } catch {
      console.error("Could not clear guest-upgrade attempts");
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Something went wrong. Reload the page and try again." }, { status: 400 });
}
