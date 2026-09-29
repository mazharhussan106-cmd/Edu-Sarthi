// Owns the rules for a teacher's hold on a submission: how long a claim lasts,
// what counts as urgent in the queue, and giving expired claims back.
//
// Expired claims are released lazily — whenever the queue or a review page is
// read — rather than by a scheduled job. Serverless has no always-on process to
// run one, and a claim only matters at the moment someone looks at the queue.
//
// It deliberately does NOT decide who may claim. That is the route handler's
// job, next to the role check.

import { prisma } from "@/lib/prisma";

/// How long a claim holds before the submission returns to the queue.
export const CLAIM_MINUTES = 30;

/// A student should hear back within a day. Items inside the last four hours
/// of that are "Urgent".
export const SLA_HOURS = 24;
export const URGENT_WITHIN_HOURS = 4;

const HOUR_MS = 3_600_000;

export function claimExpiresAt(claimedAt: Date): Date {
  return new Date(claimedAt.getTime() + CLAIM_MINUTES * 60_000);
}

export function slaDueAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + SLA_HOURS * HOUR_MS);
}

/// createdAt before this means fewer than URGENT_WITHIN_HOURS left on the SLA.
export function urgentBefore(now = new Date()): Date {
  return new Date(now.getTime() - (SLA_HOURS - URGENT_WITHIN_HOURS) * HOUR_MS);
}

/// Puts every submission whose claim has run out back in the queue. Returns
/// how many were released, so a page can mention it.
export async function releaseExpiredClaims(): Promise<number> {
  const cutoff = new Date(Date.now() - CLAIM_MINUTES * 60_000);
  const { count } = await prisma.submission.updateMany({
    where: { status: "IN_REVIEW", claimedAt: { lt: cutoff } },
    data: { status: "PENDING", claimedById: null, claimedAt: null },
  });
  return count;
}
