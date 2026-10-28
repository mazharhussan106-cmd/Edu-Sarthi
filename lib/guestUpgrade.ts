// Owns the code that turns a guest into a full account: issuing a six-digit
// code for one guest and one email address, and redeeming it.
//
// It uses Auth.js's VerificationToken table, like the email-code sign-in
// (lib/emailLogin), but under its own identifier, "guest-upgrade:<guest id>:
// <email>". A code sent here therefore cannot sign anyone in, and a sign-in
// code cannot upgrade a guest: each only works for what it was sent for.
//
// It deliberately does NOT send the email or change the account. The route
// handler does both, after its own checks.

import { createHash, randomInt } from "crypto";

import { prisma } from "@/lib/prisma";

const TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function identifier(userId: string, email: string): string {
  return `guest-upgrade:${userId}:${email}`;
}

function hash(code: string): string {
  return createHash("sha256").update(`guest-upgrade:${code}`).digest("hex");
}

export type IssueUpgradeResult = { ok: true; code: string } | { ok: false; retryInSec: number };

export async function issueUpgradeCode(userId: string, email: string): Promise<IssueUpgradeResult> {
  const id = identifier(userId, email);
  // The table keeps no creation time, so it is worked out from the expiry.
  const latest = await prisma.verificationToken.findFirst({ where: { identifier: id }, orderBy: { expires: "desc" } });
  if (latest) {
    const elapsed = Date.now() - (latest.expires.getTime() - TTL_MS);
    if (elapsed < RESEND_COOLDOWN_MS) return { ok: false, retryInSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  // Every older code for this guest dies, whichever address it was for, so
  // only the newest email works.
  await prisma.verificationToken.deleteMany({ where: { identifier: { startsWith: `guest-upgrade:${userId}:` } } });
  await prisma.verificationToken.create({ data: { identifier: id, token: hash(code), expires: new Date(Date.now() + TTL_MS) } });
  return { ok: true, code };
}

/// True when the code is the live one for this guest and address. A good code
/// is spent at once, so it cannot be used twice.
export async function redeemUpgradeCode(userId: string, email: string, code: string): Promise<boolean> {
  const id = identifier(userId, email);
  const row = await prisma.verificationToken.findFirst({ where: { identifier: id, token: hash(code), expires: { gt: new Date() } } });
  if (!row) return false;
  await prisma.verificationToken.deleteMany({ where: { identifier: id } });
  return true;
}
