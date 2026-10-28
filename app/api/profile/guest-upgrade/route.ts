// Owns a guest keeping their progress, in two calls: "send" emails a code to
// the address they give, and "verify" checks it and acts.
//
// - A new address: the same account row gets the email. Cards, history and
//   settings stay, because nothing moves.
// - An address that already has a student account: the guest's cards and
//   history are added to that account (lib/guestMerge), the guest row is
//   deleted, and the person signs in there. The code went to that account's
//   inbox, so only its owner can do this.
// - Any other account (teacher, admin, suspended) is refused.
//
// Both calls are throttled per guest on the sign-in throttle's table: sending,
// because anyone can make a guest and point the site's mail at any address;
// checking, because a six-digit code is only safe while guessing is slow.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { issueAccountCode, redeemAccountCode } from "@/lib/accountCodes";
import { requireUser } from "@/lib/apiUser";
import { sendGuestMergeCode, sendGuestUpgradeCode } from "@/lib/email";
import { mergeGuestInto, mergeTarget } from "@/lib/guestMerge";
import { clearLoginAttempts, isRateLimited, recordFailedLogin } from "@/lib/loginRateLimit";
import { prisma } from "@/lib/prisma";
import { guestUpgradeSendSchema, guestUpgradeVerifySchema } from "@/lib/validations";

const REFUSED = "That email belongs to an account this guest's progress cannot be added to. Use a different email, or sign out and sign in with that one.";
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  // Not member: true. Guests are exactly who this is for.
  const gate = await requireUser();
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  let body: { action?: unknown } & Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Something went wrong. Please try again.");
  }

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { isGuest: true } });
  if (!me?.isGuest) return bad("This account already has an email. Reload the page to see your settings.");

  if (body.action === "send") {
    const parsed = guestUpgradeSendSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Check your name and email.");
    const { email } = parsed.data;

    const target = await mergeTarget(email);
    if (target.kind === "refused") return bad(REFUSED, 409);
    const mode = target.kind === "student" ? "merge" : "upgrade";

    const sendKey = `guest-upgrade-send:${userId}`;
    if (await isRateLimited(sendKey)) return bad("Too many codes asked for. Wait 15 minutes, then try again.", 429);
    const issued = await issueAccountCode(mode === "merge" ? "guest-merge" : "guest-upgrade", userId, email);
    if (!issued.ok) return bad(`A code was just sent. Wait ${issued.retryInSec} seconds before asking for another.`, 429);
    // Counted on every send that goes out, not only on failures: this caps
    // how much mail one guest can make the site send.
    await recordFailedLogin(sendKey);
    try {
      if (mode === "merge") await sendGuestMergeCode(email, issued.code);
      else await sendGuestUpgradeCode(email, issued.code);
    } catch {
      return bad("We could not send the email. Check the address and try again in a minute.", 502);
    }
    return NextResponse.json({ ok: true, mode });
  }

  if (body.action === "verify") {
    const parsed = guestUpgradeVerifySchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Check the code and try again.");
    const { name, email, code } = parsed.data;

    const checkKey = `guest-upgrade:${userId}`;
    if (await isRateLimited(checkKey)) return bad("Too many wrong codes. Wait 15 minutes, then ask for a new code.", 429);

    // Decided again now, not trusted from the send: the address may have
    // gained an account in between, and then the code that was sent is for
    // the other purpose and simply will not match.
    const target = await mergeTarget(email);
    if (target.kind === "refused") return bad(REFUSED, 409);
    const purpose = target.kind === "student" ? "guest-merge" : "guest-upgrade";
    if (!(await redeemAccountCode(purpose, userId, email, code))) {
      await recordFailedLogin(checkKey);
      return bad("That code is not right, or it has expired. Check the newest email, or ask for a new code.");
    }

    let result: { mode: "upgrade" } | { mode: "merge"; moved: number };
    if (target.kind === "student") {
      result = { mode: "merge", ...(await mergeGuestInto(userId, target.id)) };
    } else {
      try {
        // isGuest in the WHERE: two tabs confirming at once convert it once.
        const { count } = await prisma.user.updateMany({
          where: { id: userId, isGuest: true },
          data: { email, emailVerified: new Date(), isGuest: false, name },
        });
        if (count === 0) return bad("This account already has an email. Reload the page to see your settings.", 409);
      } catch (e) {
        // Someone else took the address between the code and now.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return bad("That email was just used for another account. Ask for a new code to add your progress to it.", 409);
        throw e;
      }
      result = { mode: "upgrade" };
    }

    // Outside the write: the throttle heals on its own as its window slides.
    try {
      await clearLoginAttempts(checkKey);
    } catch {
      console.error("Could not clear guest-upgrade attempts");
    }
    return NextResponse.json({ ok: true, ...result });
  }

  return bad("Something went wrong. Reload the page and try again.");
}
