// Owns the six-digit email verification code: issuing, resending, checking.
// The database stores a hash, never the code itself.
//
// It deliberately does NOT send the email. Issuing returns the code and the
// caller passes it to lib/email.ts — which keeps this file testable without a
// mail provider.

import { createHash, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

// sha256, not bcrypt. The code lives ten minutes and the guess space is a
// million — a slow hash buys nothing here and costs 100ms on every check.
function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/// crypto.randomInt, not Math.random. Math.random is seeded predictably enough
/// that codes become guessable from a handful of observed samples.
function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; reason: "cooldown"; retryInSec: number };

export async function issueVerificationCode(
  userId: string,
): Promise<IssueResult> {
  const latest = await prisma.verificationCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (latest) {
    const elapsed = Date.now() - latest.createdAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "cooldown",
        retryInSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  const code = generateCode();

  // Older codes are consumed rather than deleted, so a user who requests a
  // second code cannot still verify with the first one from their inbox.
  await prisma.verificationCode.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.verificationCode.create({
    data: {
      userId,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  return { ok: true, code };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "too-many-attempts" };

export async function verifyCode(
  userId: string,
  submitted: string,
): Promise<VerifyResult> {
  const record = await prisma.verificationCode.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, reason: "invalid" };
  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too-many-attempts" };
  }
  if (record.expiresAt < new Date()) return { ok: false, reason: "expired" };

  // Counted before the comparison. Incrementing only on failure means a
  // crash mid-check hands back a free attempt.
  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
  });

  // timingSafeEqual on the hex digests, not === on the codes. String compare
  // exits at the first differing character, which leaks how many leading
  // digits were right and turns one million-guess space into six ten-guess
  // ones. Both buffers are 64 bytes because both are sha256 hex — the
  // function throws on a length mismatch.
  const matches = timingSafeEqual(
    Buffer.from(hashCode(submitted)),
    Buffer.from(record.codeHash),
  );

  if (!matches) return { ok: false, reason: "invalid" };

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return { ok: true };
}
