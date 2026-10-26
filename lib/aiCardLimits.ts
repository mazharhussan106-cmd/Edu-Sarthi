// Owns the allowance for the AI card maker: how many cards a free account may
// have the AI make in total, the ceiling on tokens it may spend, and counting
// both. Admins are not limited.
//
// The free allowance is a lifetime total, not a daily one: a person who makes
// one card at a time over a year reaches it exactly as a person who asks for
// all of them at once. There is no paid plan yet, so everyone who is not an
// admin is on the free one; when plans exist, the numbers here are the one
// place to change.
//
// It deliberately does NOT call the model, validate requests or know about
// decks. The cards are reserved BEFORE the model is asked, in one SQL
// statement, so ten parallel requests cannot each pass a check and together
// overshoot the total.

import { Prisma, type Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const FREE_CARDS_TOTAL = 100;
/// A ceiling on model tokens for one free account, for the case the card total
/// does not catch: asking questions again and again, or very large sources.
/// 100 ordinary cards use well under a fifth of this.
export const FREE_TOKENS_TOTAL = 1_500_000;

export type Reservation =
  | { ok: true; granted: number; remaining: number | null }
  | { ok: false; error: string };

const USED_UP = `You have used all ${FREE_CARDS_TOTAL} of your free AI cards. You can still make cards by hand, and every card you already have stays in your decks.`;
const TOKENS_UP = "You have used your free AI allowance. You can still make cards by hand, and every card you already have stays in your decks.";

/// Null when there is no cap (admins), else the cards still available.
export async function remainingCards(userId: string, role: Role): Promise<number | null> {
  if (role === "ADMIN") return null;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { aiCardsUsed: true } });
  return Math.max(0, FREE_CARDS_TOTAL - (u?.aiCardsUsed ?? 0));
}

/// Whether this person may ask the AI anything at all right now. Used before
/// the questions step, which makes no cards but still costs tokens.
export async function mayAsk(userId: string, role: Role): Promise<string | null> {
  if (role === "ADMIN") return null;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { aiCardsUsed: true, aiTokensUsed: true } });
  if (!u) return USED_UP;
  if (u.aiCardsUsed >= FREE_CARDS_TOTAL) return USED_UP;
  if (u.aiTokensUsed >= FREE_TOKENS_TOTAL) return TOKENS_UP;
  return null;
}

/// Takes up to `wanted` cards from the allowance and says how many it gave.
/// Fewer than wanted when the allowance is nearly gone, none when it is gone.
export async function reserveCards(userId: string, role: Role, wanted: number): Promise<Reservation> {
  const blocked = await mayAsk(userId, role);
  if (blocked) return { ok: false, error: blocked };
  if (role === "ADMIN") return { ok: true, granted: wanted, remaining: null };

  // One statement: lock the row, read how many are used, add what fits. The
  // lock is what makes two simultaneous requests take turns.
  const rows = await prisma.$queryRaw<{ before: number; after: number }[]>(Prisma.sql`
    WITH old AS (SELECT "aiCardsUsed" AS used FROM "User" WHERE id = ${userId} FOR UPDATE)
    UPDATE "User" SET "aiCardsUsed" = LEAST("aiCardsUsed" + ${wanted}, ${FREE_CARDS_TOTAL})
    FROM old
    WHERE "User".id = ${userId} AND old.used < ${FREE_CARDS_TOTAL}
    RETURNING old.used AS before, "User"."aiCardsUsed" AS after`);
  const row = rows[0];
  if (!row) return { ok: false, error: USED_UP };
  return { ok: true, granted: row.after - row.before, remaining: FREE_CARDS_TOTAL - row.after };
}

/// After the model has answered (or failed): gives back the cards that were
/// reserved but not made, and adds the tokens spent. A failed request passes
/// used = 0, so a failure costs the person nothing.
export async function settleCards(userId: string, role: Role, granted: number, used: number, tokens: number): Promise<void> {
  const refund = role === "ADMIN" ? 0 : Math.max(0, granted - used);
  if (!refund && !tokens) return;
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(refund ? { aiCardsUsed: { decrement: refund } } : {}),
      ...(tokens ? { aiTokensUsed: { increment: tokens } } : {}),
    },
  });
}
