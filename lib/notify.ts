// Owns "should this student be emailed about X, and send it": reads the
// student's own preference first, then sends.
//
// It deliberately never throws. Callers run it after their real work has
// committed, and a mail provider hiccup must not turn a saved audit into an
// error on the teacher's screen.

import { appUrl } from "@/lib/appUrl";
import { sendAuditReady } from "@/lib/email";
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
