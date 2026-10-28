// Owns "should this person be emailed about X, and send it": reads their own
// preference first, then sends. A student hears that an audit is ready; a
// teacher or admin who asked hears that a recording arrived in their queue.
//
// It deliberately never throws. Callers run it after their real work has
// committed, and a mail provider hiccup must not turn a saved audit into an
// error on the teacher's screen.

import { appUrl } from "@/lib/appUrl";
import { sendAuditReady, sendNewRecording } from "@/lib/emailNotices";
import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";

export async function notifyAuditReady(submissionId: string, req?: Request): Promise<void> {
  try {
    const row = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { student: { select: { email: true, emailVerified: true, preferences: true } } },
    });
    const student = row?.student;
    if (!student?.email || !student.emailVerified) return;

    // "No key" must mean the default (on), not "off": prefsOf layers over defaults.
    const wants = prefsOf(student.preferences).emailOnAudit;
    if (!wants) return;

    await sendAuditReady(student.email, `${appUrl(req)}/feedback/${submissionId}`);
  } catch (err) {
    console.error("Audit-ready email not sent", err instanceof Error ? err.message : "unknown error");
  }
}

/// Who sees a recording in their queue (lib/claims queueScope): every teacher
/// for the shared queue, only the deck's teacher for a recording on their
/// deck, and every admin. Of those, the ones who switched this email on.
export async function notifyNewRecording(submissionId: string, req?: Request): Promise<void> {
  try {
    const row = await prisma.submission.findUnique({ where: { id: submissionId }, select: { assignedTeacherId: true } });
    if (!row) return;
    const reviewers = await prisma.user.findMany({
      where: {
        suspendedAt: null,
        email: { not: null },
        // An unproven address may belong to someone else; never mail it.
        emailVerified: { not: null },
        preferences: { path: ["emailOnNewRecording"], equals: true },
        OR: [
          { role: "ADMIN" },
          { role: "TEACHER", ...(row.assignedTeacherId ? { id: row.assignedTeacherId } : {}) },
        ],
      },
      select: { email: true },
      // Teachers are few; this only stops a mistake from becoming a mail-out.
      take: 200,
    });
    const url = `${appUrl(req)}/queue`;
    for (const r of reviewers) {
      if (!r.email) continue;
      try {
        await sendNewRecording(r.email, url);
      } catch (err) {
        // One bad address must not stop the rest.
        console.error("New-recording email not sent", err instanceof Error ? err.message : "unknown error");
      }
    }
  } catch (err) {
    console.error("New-recording emails not sent", err instanceof Error ? err.message : "unknown error");
  }
}
