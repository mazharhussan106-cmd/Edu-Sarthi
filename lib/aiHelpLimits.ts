// Owns the help chatbot's daily allowance (owner's decision N11): 20 questions
// a day for an account, 5 for a guest, counted per India day in AiHelpLog.
//
// A question is reserved before the model is called, under a per-person lock,
// so a burst of taps cannot pass the limit together; a call that fails on our
// side is given back. It deliberately does NOT call the model (lib/aiHelp) or
// decide who may ask (the route does).

import { istDayStart } from "@/lib/aiLimits";
import { prisma } from "@/lib/prisma";

export const HELP_PER_DAY = { member: 20, guest: 5 } as const;
/// Only today's rows are ever counted; two days covers the IST day boundary.
const KEEP_MS = 2 * 86_400_000;

const limitFor = (isGuest: boolean) => (isGuest ? HELP_PER_DAY.guest : HELP_PER_DAY.member);

export async function helpLeft(userId: string, isGuest: boolean): Promise<number> {
  const used = await prisma.aiHelpLog.count({ where: { userId, createdAt: { gte: istDayStart() } } });
  return Math.max(0, limitFor(isGuest) - used);
}

export type HelpSeat = { ok: true; id: string; left: number } | { ok: false; error: string };

export async function reserveHelp(userId: string, isGuest: boolean): Promise<HelpSeat> {
  const limit = limitFor(isGuest);
  return prisma.$transaction(
    async (tx) => {
      // Its own lock key, so asking for help never waits on a deck being saved.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`help:${userId}`}))`;
      const used = await tx.aiHelpLog.count({ where: { userId, createdAt: { gte: istDayStart() } } });
      if (used >= limit) {
        const more = isGuest ? " Create a free account for 20 a day." : "";
        return { ok: false as const, error: `You have asked ${limit} questions today, the most for a day. The count starts again at midnight India time.${more} The questions below and the Support page may already have your answer.` };
      }
      const row = await tx.aiHelpLog.create({ data: { userId }, select: { id: true } });
      return { ok: true as const, id: row.id, left: limit - used - 1 };
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
}

/// The model could not be reached or failed: the question does not count.
export async function refundHelp(id: string): Promise<void> {
  await prisma.aiHelpLog.deleteMany({ where: { id } });
}

export async function recordHelpTokens(id: string, tokens: number): Promise<void> {
  await prisma.aiHelpLog.updateMany({ where: { id }, data: { tokens } });
}

/// Called by the daily retention cron.
export async function sweepHelpLog(now = new Date()): Promise<number> {
  const res = await prisma.aiHelpLog.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - KEEP_MS) } } });
  return res.count;
}
