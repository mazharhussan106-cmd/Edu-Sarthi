// Owns the limits on AI drafts: how many one teacher may ask for in a day, how
// many one submission may have, and where "a day" starts.
//
// It deliberately does NOT decide who may ask (the route does) or call any AI
// service. The count lives in AiDraftLog and nowhere else.

import { prisma } from "@/lib/prisma";

export const DAILY_DRAFTS_PER_TEACHER = 500;
export const DRAFTS_PER_SUBMISSION = 3;

const DAY_MS = 86_400_000;
// India has no daylight saving, so a fixed offset is exact. The teachers are
// in India; a UTC day would reset their allowance at 5:30 in the morning.
const IST_OFFSET_MS = 330 * 60_000;

/// The most recent midnight in India, as a moment in time.
export function istDayStart(now = new Date()): Date {
  const shifted = now.getTime() + IST_OFFSET_MS;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS - IST_OFFSET_MS);
}

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
