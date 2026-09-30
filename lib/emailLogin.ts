// Owns passwordless sign-in by email: issuing a six-digit code plus a one-tap
// link, and redeeming either one for an account.
//
// Both live in Auth.js's VerificationToken table (identifier = email), hashed.
// That table has no user foreign key, which is the point: a student who has
// never signed up can prove they own an inbox, and the account is created only
// once they have.
//
// It deliberately does NOT send the email or create a session. The route
// handler sends; the Credentials providers in lib/auth.ts sign in.

import { createHash, randomBytes, randomInt } from "crypto";

import { prisma } from "@/lib/prisma";
import { generatePublicId } from "@/lib/publicId";

const TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

// Prefixed so a code can never be redeemed as a link token or the reverse,
// even though both sit in the same column.
function hash(kind: "code" | "link", raw: string): string {
  return createHash("sha256").update(`${kind}:${raw}`).digest("hex");
}

export type IssueLoginResult =
  | { ok: true; code: string; linkToken: string }
  | { ok: false; retryInSec: number };

export async function issueEmailLogin(email: string): Promise<IssueLoginResult> {
  // The table stores no creation time, so it is derived from the expiry every
  // row is given. Two rows exist per issue; either one answers the question.
  const latest = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
  });
  if (latest) {
    const issuedAt = latest.expires.getTime() - TTL_MS;
    const elapsed = Date.now() - issuedAt;
    if (elapsed < RESEND_COOLDOWN_MS) {
      return { ok: false, retryInSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) };
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  // 32 random bytes for the link. A link sits in an inbox and in mail-server
  // logs, so unlike the typed code it cannot rely on an attempt limit.
  const linkToken = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TTL_MS);

  // Older codes die when a new one is issued, so only the newest email works.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.createMany({
    data: [
      { identifier: email, token: hash("code", code), expires },
      { identifier: email, token: hash("link", linkToken), expires },
    ],
  });

  return { ok: true, code, linkToken };
}

type Redeemed = { email: string } | null;

export async function redeemCode(email: string, code: string): Promise<Redeemed> {
  const row = await prisma.verificationToken.findFirst({
    where: { identifier: email, token: hash("code", code), expires: { gt: new Date() } },
  });
  if (!row) return null;
  // Both the code and its sibling link are spent together. Leaving the link
  // alive would give the same email a second, unused way in.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  return { email };
}

export async function redeemLink(linkToken: string): Promise<Redeemed> {
  const row = await prisma.verificationToken.findFirst({
    where: { token: hash("link", linkToken), expires: { gt: new Date() } },
  });
  if (!row) return null;
  await prisma.verificationToken.deleteMany({ where: { identifier: row.identifier } });
  return { email: row.identifier };
}

/// Finds the account for a proven email, creating a student account if there
/// is none. Proving the inbox also counts as verifying it.
export async function userForProvenEmail(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.emailVerified) return existing;
    return prisma.user.update({
      where: { id: existing.id },
      data: { emailVerified: new Date() },
    });
  }

  // One retry on a publicId collision. A second collision in a row is not
  // bad luck, it is a bug, and should surface.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await prisma.user.create({
        data: {
          email,
          emailVerified: new Date(),
          publicId: generatePublicId(),
          role: "STUDENT",
        },
      });
    } catch (err) {
      const again = await prisma.user.findUnique({ where: { email } });
      // Two tabs redeeming at once: the other one created it.
      if (again) return again;
      if (attempt === 1) throw err;
    }
  }
  throw new Error("unreachable");
}
