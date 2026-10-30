// Owns the limits on AI drafts: how many one teacher may ask for in a day, how
// many one submission may have, and where "a day" starts.
//
// It deliberately does NOT decide who may ask (the route does) or call any AI
// service. The count lives in AiDraftLog and nowhere else.

import { prisma } from "@/lib/prisma";
import { istDayStart } from "@/lib/srs";

export const DAILY_DRAFTS_PER_TEACHER = 500;
export const DRAFTS_PER_SUBMISSION = 3;

// One definition of an India day for every daily limit in the app; lib/srs
// holds it because it imports no database code. The teachers are in India; a
// UTC day would reset their allowance at 5:30 in the morning. Re-exported so
// the many callers that import it from here keep working.
export { istDayStart };

export type Reservation = { ok: true } | { ok: false; error: string };

/// Checks both limits and, if there is room, records the request.
///
/// The row is written before the AI is called, not after it succeeds: a call
/// that keeps failing must still count, or one stuck button costs money
/// without end. The count and the write are two statements, so a burst of
/// simultaneous clicks can overshoot by a few. Over 500 a day that is a rounding
/// error, and a lock here would slow every draft for nothing.
export async function reserveDraft(teacherId: string, submissionId: string): Promise<Reservation> {
  const [today, forSubmission] = await Promise.all([
    prisma.aiDraftLog.count({ where: { teacherId, createdAt: { gte: istDayStart() } } }),
    prisma.aiDraftLog.count({ where: { submissionId } }),
  ]);

  if (today >= DAILY_DRAFTS_PER_TEACHER) {
    return {
      ok: false,
      error: `You have used today's ${DAILY_DRAFTS_PER_TEACHER} AI drafts. Write this audit by hand; the count starts again at midnight IST.`,
    };
  }
  if (forSubmission >= DRAFTS_PER_SUBMISSION) {
    return {
      ok: false,
      error: `This recording already has ${DRAFTS_PER_SUBMISSION} AI drafts. Use one of them, or write the audit by hand.`,
    };
  }

  await prisma.aiDraftLog.create({ data: { teacherId, submissionId } });
  return { ok: true };
}
