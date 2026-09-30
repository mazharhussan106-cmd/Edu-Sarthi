// Owns sign-in throttling: 8 failed attempts per email per 15 minutes.
//
// Deliberately NOT an in-memory Map. Each serverless invocation is its own
// process, so an in-memory counter resets constantly — it looks like it works
// on localhost and does nothing in production.
//
// Deliberately NOT a hard lockout. A lockout is a denial-of-service tool:
// send five bad passwords at a known address and the real owner is locked out
// too. Slowing attempts is enough; blocking the owner is not acceptable.

import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function windowStart(): Date {
  return new Date(Date.now() - WINDOW_MS);
}

/// Returns true when the caller should refuse without checking the password.
/// Call this BEFORE the user lookup and BEFORE bcrypt: bcrypt is deliberately
/// slow (~100ms), so an attacker who can trigger it freely gets a cheap
/// CPU-exhaustion primitive against the whole app.
export async function isRateLimited(email: string): Promise<boolean> {
  const count = await prisma.loginAttempt.count({
    where: { email: email.toLowerCase(), createdAt: { gte: windowStart() } },
  });

  return count >= MAX_ATTEMPTS;
}

/// Recorded even when no account exists for the address. Otherwise the
/// throttle only protects real users, and probing for valid addresses stays
/// free and unlimited.
export async function recordFailedLogin(email: string): Promise<void> {
  await prisma.loginAttempt.create({
    data: { email: email.toLowerCase() },
  });
}

/// Cleared on success, so one forgotten password does not eat into the
/// allowance for the rest of the window.
export async function clearLoginAttempts(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: { email: email.toLowerCase() },
  });
}
