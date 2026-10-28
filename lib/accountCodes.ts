// Owns the six-digit codes that prove an inbox for one account change: a guest
// adding an email, a guest adding their progress to the account that email
// already has, and a member changing theirs (a code to the new address, and
// one to the current address for an account with no password).
//
// They live in Auth.js's VerificationToken table, like the email-code sign-in
// (lib/emailLogin), but each under "<purpose>:<user id>:<email>". A code sent
// for one purpose therefore cannot be used for another, and none of them can
// sign anyone in.
//
// It deliberately does NOT send email or change accounts; route handlers do,
// after their own checks. Wrong-guess throttling is theirs too.

import { createHash, randomInt } from "crypto";

import { prisma } from "@/lib/prisma";

export type CodePurpose = "guest-upgrade" | "guest-merge" | "email-new" | "email-old";

const TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const identifier = (purpose: CodePurpose, userId: string, email: string) => `${purpose}:${userId}:${email}`;
const hash = (purpose: CodePurpose, code: string) => createHash("sha256").update(`${purpose}:${code}`).digest("hex");

export type IssueCodeResult = { ok: true; code: string } | { ok: false; retryInSec: number };

export async function issueAccountCode(purpose: CodePurpose, userId: string, email: string): Promise<IssueCodeResult> {
  const id = identifier(purpose, userId, email);
  // The table keeps no creation time, so it is worked out from the expiry.
  const latest = await prisma.verificationToken.findFirst({ where: { identifier: id }, orderBy: { expires: "desc" } });
  if (latest) {
    const elapsed = Date.now() - (latest.expires.getTime() - TTL_MS);
    if (elapsed < RESEND_COOLDOWN_MS) return { ok: false, retryInSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  // Every older code for this purpose and person dies, whichever address it
  // was for, so only the newest email works.
  await spendAccountCodes(purpose, userId);
  await prisma.verificationToken.create({ data: { identifier: id, token: hash(purpose, code), expires: new Date(Date.now() + TTL_MS) } });
  return { ok: true, code };
}

/// Checks a code without using it up, so a change that needs two codes can
/// check both before spending either.
export async function accountCodeMatches(purpose: CodePurpose, userId: string, email: string, code: string): Promise<boolean> {
  const row = await prisma.verificationToken.findFirst({
    where: { identifier: identifier(purpose, userId, email), token: hash(purpose, code), expires: { gt: new Date() } },
  });
  return Boolean(row);
}

export async function spendAccountCodes(purpose: CodePurpose, userId: string): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { identifier: { startsWith: `${purpose}:${userId}:` } } });
}

/// Checks and spends in one step, for a change that needs only one code.
export async function redeemAccountCode(purpose: CodePurpose, userId: string, email: string, code: string): Promise<boolean> {
  if (!(await accountCodeMatches(purpose, userId, email, code))) return false;
  await spendAccountCodes(purpose, userId);
  return true;
}
