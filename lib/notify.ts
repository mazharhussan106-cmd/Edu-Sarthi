// Owns telling people what happened, by their own preference: a student hears
// that an audit is ready (a note in their notification inbox always, the email
// when their preference allows it) or that a recording was sent back (inbox
// only); a teacher or admin who asked hears that a recording arrived in their
// queue.
//
// It deliberately never throws. Callers run it after their real work has
// committed, and a mail provider hiccup must not turn a saved audit into an
// error on the teacher's screen.

import { appUrl } from "@/lib/appUrl";
import { RETURN_REASON_LABEL } from "@/lib/audits";
import { sendAuditReady, sendNewRecording } from "@/lib/emailNotices";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";

export async function notifyAuditReady(submissionId: string, req?: Request): Promise<void> {
  try {
    const row = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { studentId: true, student: { select: { email: true, emailVerified: true, preferences: true } } },
    });
    if (!row) return;

    // The inbox note is not behind the email switch: that setting is about
    // email, and an inbox that missed audits would be one nobody trusts.
    await notify(row.studentId, "audit_ready", {
      title: "Your audit is ready",
      body: "Your teacher has audited your recording. Open it to see your scores and notes.",
      link: `/feedback/${submissionId}`,
    });

    const student = row.student;
    if (!student.email || !student.emailVerified) return;

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

/// A recording the teacher could not audit. There was no email for this
/// before the inbox, so it stays inbox-only: the student is not asked to opt
/// out of mail they never signed up for.
export async function notifySentBack(submissionId: string): Promise<void> {
  try {
    const row = await prisma.submission.findUnique({ where: { id: submissionId }, select: { studentId: true, returnReason: true } });
    if (!row) return;
    const why = row.returnReason ? `Reason: ${RETURN_REASON_LABEL[row.returnReason]}. ` : "";
    await notify(row.studentId, "sent_back", {
      title: "Your recording was sent back",
      body: `${why}Open it to read the tips, then record it again.`,
      link: `/feedback/${submissionId}`,
    });
  } catch (err) {
    console.error("Sent-back notification not saved", err instanceof Error ? err.message : "unknown error");
  }
}
