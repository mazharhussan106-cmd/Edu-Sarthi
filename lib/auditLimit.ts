// Owns the daily limit on recordings a student sends for a teacher's audit:
// what counts against it, and the words that explain it. How many a day is an
// admin setting (lib/appSettings, Admin → Site settings; 2 to start, the owner's
// choice on 28 Oct).
//
// A replacement for a recording the teacher sent back does not count, because
// the teacher asked for it. Flashcard study has no limit.
//
// It deliberately does NOT refuse anything itself; the upload and submission
// routes do, and the practice pages show what is left.

import { istDayStart } from "@/lib/aiLimits";
import { getAuditsPerDay } from "@/lib/appSettings";
import { prisma } from "@/lib/prisma";

export function auditLimitReached(perDay: number): string {
  return `You have sent today's ${perDay} recording${perDay === 1 ? "" : "s"} for audit, the daily limit. Send the next one tomorrow; the count starts again at midnight India time.`;
}

/// Today's allowance (India day) and what is left of it, not counting
/// replacements.
export async function auditAllowance(studentId: string): Promise<{ perDay: number; left: number }> {
  const [perDay, sent] = await Promise.all([
    getAuditsPerDay(),
    prisma.submission.count({ where: { studentId, retryOfId: null, createdAt: { gte: istDayStart() } } }),
  ]);
  return { perDay, left: Math.max(0, perDay - sent) };
}
