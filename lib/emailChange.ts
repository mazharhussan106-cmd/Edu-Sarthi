// Owns changing an account's sign-in email: starting a change (prove it is
// you, then a code goes to the new address) and confirming it with the code.
//
// Proof: the current password, or for an account without one (Google or
// email-code sign-in) a second code sent to the current address. The change
// itself signs out every device (owner's decision N8), because the browser's
// session still carries the old address. At most 3 changes in 30 days.
//
// It deliberately never says whether an address already has an account: a
// taken address gets a warning email instead of a code, and every screen reads
// the same either way. It does NOT send email; the route sends what this
// returns, after the rows are written.

import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { clearLoginAttempts, isRateLimited, recordFailedLogin } from "@/lib/loginRateLimit";
import { prisma } from "@/lib/prisma";

const TTL_MS = 10 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const DAY_MS = 86_400_000;
const MAX_ATTEMPTS = 5;
/// Owner's decision (28 Oct 2026).
export const CHANGES_PER_30_DAYS = 3;
/// Each request emails an address the person typed, so it is capped per day:
/// otherwise this form is a free way to send our mail to strangers.
const REQUESTS_PER_DAY = 5;

type Failure = { ok: false; error: string; status: number };
const fail = (error: string, status = 400): Failure => ({ ok: false, error, status });

export type StartResult =
  | {
      ok: true;
      requestId: string;
      /// What to send to the new address: a code, or the "already has an account" warning.
      toNew: { email: string; code: string | null };
      /// Accounts without a password only: the code for the current address.
      toCurrent: { email: string; code: string } | null;
    }
  | Failure;

// Prefixed so a code from this flow can never match a hash from another one.
const hash = (raw: string) => createHash("sha256").update(`email-change:${raw}`).digest("hex");
const sixDigits = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

function sameHash(raw: string | undefined, stored: string): boolean {
  if (!raw) return false;
  const a = Buffer.from(hash(raw));
  const b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
}

const dateIn = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

async function changeLimitReached(userId: string, now: Date): Promise<Failure | null> {
  const done = await prisma.emailChange.findMany({
    where: { userId, consumedAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } },
    orderBy: { consumedAt: "asc" },
    select: { consumedAt: true },
  });
  if (done.length < CHANGES_PER_30_DAYS) return null;
  const freeOn = new Date(done[0].consumedAt!.getTime() + 30 * DAY_MS);
  return fail(`You can change your email ${CHANGES_PER_30_DAYS} times in 30 days. You can change it again from ${dateIn(freeOn)}.`, 429);
}

export async function startEmailChange(userId: string, input: { newEmail: string; password?: string }): Promise<StartResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true, isGuest: true } });
  if (!user || user.isGuest) return fail("Guests have no sign-in email. Create a free account first.", 403);
  if (input.newEmail === user.email) return fail("That is already your sign-in email. Type the new address.");

  if (user.passwordHash) {
    // The same throttle as signing in, keyed on the same address, so this form
    // gives no extra guesses at the password.
    const key = user.email ?? `user:${userId}`;
    if (await isRateLimited(key)) return fail("Too many wrong passwords. Wait 15 minutes, then try again.", 429);
    if (!input.password || !(await bcrypt.compare(input.password, user.passwordHash))) {
      await recordFailedLogin(key);
      return fail("That password is not right. Try again, or reset it with Forgot password on the sign-in page.");
    }
    await clearLoginAttempts(key);
  } else if (!user.email) {
    return fail("This account has no email or password to prove it is yours. Write to support@edusarthi.com for help.");
  }

  const now = new Date();
  // The monthly limit first: "wait 60 seconds" is no help to someone who
  // cannot change it again for weeks.
  const limit = await changeLimitReached(userId, now);
  if (limit) return limit;
  const latest = await prisma.emailChange.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  const waited = latest ? now.getTime() - latest.createdAt.getTime() : Infinity;
  if (waited < RESEND_MS) return fail(`Wait ${Math.ceil((RESEND_MS - waited) / 1000)} seconds, then ask for a new code.`, 429);
  const today = await prisma.emailChange.count({ where: { userId, createdAt: { gte: new Date(now.getTime() - DAY_MS) } } });
  if (today >= REQUESTS_PER_DAY) return fail(`You have asked for ${REQUESTS_PER_DAY} codes today. Try again tomorrow.`, 429);

  const taken = await prisma.user.findUnique({ where: { email: input.newEmail }, select: { id: true } });
  const code = sixDigits();
  const currentCode = user.passwordHash ? null : sixDigits();

  // Only the newest request can be confirmed: an older code in an old email
  // must not change the address to something the person has since abandoned.
  await prisma.emailChange.updateMany({ where: { userId, consumedAt: null, expiresAt: { gt: now } }, data: { expiresAt: now } });
  const row = await prisma.emailChange.create({
    data: {
      userId,
      newEmail: input.newEmail,
      codeHash: hash(taken ? randomBytes(16).toString("hex") : code),
      currentCodeHash: currentCode ? hash(currentCode) : null,
      expiresAt: new Date(now.getTime() + TTL_MS),
    },
    select: { id: true },
  });

  return {
    ok: true,
    requestId: row.id,
    toNew: { email: input.newEmail, code: taken ? null : code },
    toCurrent: currentCode && user.email ? { email: user.email, code: currentCode } : null,
  };
}

/// When the email could not be sent: the request is dropped, so the person
/// can try again at once instead of waiting out the 60 seconds for nothing.
export async function cancelEmailChange(userId: string, requestId: string): Promise<void> {
  await prisma.emailChange.deleteMany({ where: { id: requestId, userId, consumedAt: null } });
}

class Spent extends Error {}
class LimitHit extends Error {}

export type ConfirmResult = { ok: true; oldEmail: string | null; newEmail: string } | Failure;

export async function confirmEmailChange(userId: string, input: { code: string; currentCode?: string }): Promise<ConfirmResult> {
  const now = new Date();
  const row = await prisma.emailChange.findFirst({
    where: { userId, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    select: { id: true, newEmail: true, codeHash: true, currentCodeHash: true },
  });
  if (!row) return fail("That code has expired. Ask for a new one.", 410);

  // The attempt is counted before the codes are compared, and atomically, so
  // parallel guesses cannot each get a free try.
  const counted = await prisma.emailChange.updateMany({ where: { id: row.id, attempts: { lt: MAX_ATTEMPTS } }, data: { attempts: { increment: 1 } } });
  if (counted.count === 0) return fail("Too many wrong codes. Ask for a new code.", 429);

  const newOk = sameHash(input.code, row.codeHash);
  const currentOk = row.currentCodeHash === null || sameHash(input.currentCode, row.currentCodeHash);
  if (!newOk || !currentOk) {
    return fail(row.currentCodeHash ? "One of the codes is not right. Check the newest emails and try again." : "That code is not right. Check the newest email and try again.");
  }

  let oldEmail: string | null;
  try {
    oldEmail = await prisma.$transaction(
      async (tx) => {
        // Re-checked here: two confirmations racing must not both count as one of the three.
        const done = await tx.emailChange.count({ where: { userId, consumedAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } } });
        if (done >= CHANGES_PER_30_DAYS) throw new LimitHit();
        const spent = await tx.emailChange.updateMany({ where: { id: row.id, consumedAt: null }, data: { consumedAt: now } });
        if (spent.count === 0) throw new Spent();
        const before = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
        await tx.user.update({ where: { id: userId }, data: { email: row.newEmail, emailVerified: now, sessionsValidFrom: now } });
        // A reset link sent to the old address must not outlive the change.
        await tx.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
        return before?.email ?? null;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
  } catch (e) {
    if (e instanceof Spent) return fail("That code was already used. Refresh the page.", 409);
    if (e instanceof LimitHit) return (await changeLimitReached(userId, now)) ?? fail("You have changed your email too often. Try again later.", 429);
    // The address was free when the code went out and someone took it since.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("That address can't be used for this account. Ask for a code for a different address.", 409);
    }
    throw e;
  }

  // Outside the transaction (not part of what must commit together): sign-in
  // codes already sent to the old address stop working.
  if (oldEmail) await prisma.verificationToken.deleteMany({ where: { identifier: oldEmail } }).catch(() => undefined);
  return { ok: true, oldEmail, newEmail: row.newEmail };
}

/// "r•••@gmail.com": enough for the owner of the old inbox to recognise the
/// change, without handing a full new address to whoever reads that inbox.
export function maskEmail(address: string): string {
  const [name, domain] = address.split("@");
  return `${name.slice(0, 1)}•••@${domain ?? ""}`;
}
