// Owns the teachers' evening queue email: who has asked for it, how many
// recordings each of them can actually take, and sending one email each.
//
// It counts what that person's own queue page would show (lib/claims
// queueScope): a teacher sees the shared pool plus recordings sent to them on
// their own deck, an admin sees everything. A count that includes another
// teacher's deck recordings would send someone to a queue that looks shorter
// than the email said.
//
// It deliberately does NOT decide when to run. The daily cron calls it, and
// nobody is emailed when their queue is empty.

import { releaseExpiredClaims, urgentBefore } from "@/lib/claims";
import { sendQueueDigest } from "@/lib/email";
import { prisma } from "@/lib/prisma";

/// Teachers are few; this cap only stops a mistake from becoming a mail-out.
const MAX_REVIEWERS = 500;

export async function sendQueueDigests(queueUrl: string): Promise<{ sent: number; failed: number }> {
  const reviewers = await prisma.user.findMany({
    where: {
      role: { in: ["TEACHER", "ADMIN"] },
      suspendedAt: null,
      email: { not: null },
      // An unproven address may belong to someone else; never mail it.
      emailVerified: { not: null },
      preferences: { path: ["emailQueueDigest"], equals: true },
    },
    orderBy: { id: "asc" },
    take: MAX_REVIEWERS,
    select: { id: true, email: true, role: true },
  });
  if (reviewers.length === 0) return { sent: 0, failed: 0 };

  // Claims that ran out are back in the queue for whoever opens it, so they
  // count as waiting here too, the same as on the queue page.
  await releaseExpiredClaims();
  const urgentCutoff = urgentBefore();
  const pending = { status: "PENDING" as const };

  const [pool, poolUrgent, all, allUrgent, assigned, assignedUrgent] = await Promise.all([
    prisma.submission.count({ where: { ...pending, assignedTeacherId: null } }),
    prisma.submission.count({ where: { ...pending, assignedTeacherId: null, createdAt: { lt: urgentCutoff } } }),
    prisma.submission.count({ where: pending }),
    prisma.submission.count({ where: { ...pending, createdAt: { lt: urgentCutoff } } }),
    prisma.submission.groupBy({ by: ["assignedTeacherId"], where: { ...pending, assignedTeacherId: { not: null } }, _count: true }),
    prisma.submission.groupBy({
      by: ["assignedTeacherId"],
      where: { ...pending, assignedTeacherId: { not: null }, createdAt: { lt: urgentCutoff } },
      _count: true,
    }),
  ]);
  const mine = new Map(assigned.map((g) => [g.assignedTeacherId, g._count]));
  const mineUrgent = new Map(assignedUrgent.map((g) => [g.assignedTeacherId, g._count]));

  let sent = 0;
  let failed = 0;
  for (const r of reviewers) {
    const admin = r.role === "ADMIN";
    const waiting = admin ? all : pool + (mine.get(r.id) ?? 0);
    const urgent = admin ? allUrgent : poolUrgent + (mineUrgent.get(r.id) ?? 0);
    if (waiting === 0 || !r.email) continue;
    try {
      await sendQueueDigest(r.email, waiting, urgent, queueUrl);
      sent++;
    } catch (err) {
      // One bad address must not stop everyone after them.
      failed++;
      console.error("Queue email not sent", err instanceof Error ? err.message : "unknown error");
    }
  }
  return { sent, failed };
}
