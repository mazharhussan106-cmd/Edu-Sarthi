// Owns the daily limit on recordings a student sends for a teacher's audit:
// how many, what counts, and the words that explain it.
//
// Two a day for now (owner's decision, 28 Oct): teachers' time is the scarce
// part of EduSarthi. A replacement for a recording the teacher sent back does
// not count, because the teacher asked for it. Flashcard study has no limit.
//
// It deliberately does NOT refuse anything itself; the upload and submission
// routes do, and the practice pages show what is left.

import { istDayStart } from "@/lib/aiLimits";
import { prisma } from "@/lib/prisma";

export const AUDITS_PER_DAY = 2;

export const AUDIT_LIMIT_REACHED = `You have sent today's ${AUDITS_PER_DAY} recordings for audit, the daily limit. Send the next one tomorrow; the count starts again at midnight India time.`;

/// Recordings sent today (India day), not counting replacements.
export async function auditsLeftToday(studentId: string): Promise<number> {
  const sent = await prisma.submission.count({ where: { studentId, retryOfId: null, createdAt: { gte: istDayStart() } } });
  return Math.max(0, AUDITS_PER_DAY - sent);
}
