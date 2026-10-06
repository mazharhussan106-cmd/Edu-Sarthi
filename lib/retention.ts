// Owns the recording retention policy: audio and video older than
// AUDIO_RETENTION_DAYS (default 90) are deleted from storage. The submission
// row, its scores and notes stay — only the recording goes, and pages already
// show "no longer available" when a file is missing.
//
// Only finished work is purged. A pending or in-review recording is never
// touched, however old: a teacher still needs to hear it.

import { prisma } from "@/lib/prisma";
import { logAdmin } from "@/lib/admin";
import { removeObjects } from "@/lib/storage";

const BATCH = 500;

export function retentionDays(): number {
  const n = Number(process.env.AUDIO_RETENTION_DAYS);
  return Number.isInteger(n) && n >= 7 ? n : 90;
}

function eligible(cutoff: Date) {
  return {
    createdAt: { lt: cutoff },
    status: { in: ["REVIEWED" as const, "RETURNED" as const] },
    mediaPurgedAt: null,
    // Seeded demo files in /public are not storage objects.
    NOT: [{ mediaUrl: { startsWith: "/" } }, { mediaUrl: "" }],
  };
}

export async function countPurgeable(): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays() * 86_400_000);
  return prisma.submission.count({ where: eligible(cutoff) });
}

/// Deletes one batch. Called repeatedly by the cron route until nothing is
/// left, so one run never holds a request open for thousands of files.
export async function purgeBatch(actorId: string | null): Promise<number> {
  const days = retentionDays();
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const rows = await prisma.submission.findMany({
    where: eligible(cutoff),
    select: { id: true, mediaUrl: true },
    take: BATCH,
  });
  if (rows.length === 0) return 0;

  // Storage first, rows second, and only the rows whose file is really gone:
  // a row blanked after a failed delete would orphan the file for good, with
  // nothing left to retry it. Failed ones stay and are tried on the next run.
  const failed = new Set(await removeObjects(rows.map((r) => r.mediaUrl)));
  const done = rows.filter((r) => !failed.has(r.mediaUrl));
  if (done.length === 0) return 0;
  await prisma.submission.updateMany({
    where: { id: { in: done.map((r) => r.id) } },
    data: { mediaUrl: "", mediaPurgedAt: new Date() },
  });
  await logAdmin(actorId, "Purged recordings", "submission", null, { count: done.length, failed: failed.size, olderThanDays: days });
  return done.length;
}

/// Short-lived security rows that nothing else removes: expired sign-in codes,
/// reset tokens and email links, and failed-login records (only the last 15
/// minutes are ever read). Kept a day past expiry so a support question about
/// "my code never worked" can still be answered, then gone.
export async function sweepExpiredAuthRows(): Promise<number> {
  const old = new Date(Date.now() - 86_400_000);
  const [a, b, c, d] = await Promise.all([
    prisma.verificationCode.deleteMany({ where: { expiresAt: { lt: old } } }),
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: old } } }),
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: old } } }),
    prisma.verificationToken.deleteMany({ where: { expires: { lt: old } } }),
  ]);
  return a.count + b.count + c.count + d.count;
}
