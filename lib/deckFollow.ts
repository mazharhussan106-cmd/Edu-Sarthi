// Owns following a library deck: a learner studies the original with their own
// progress and gets the author's fixes, instead of making a copy that never
// changes. Following, unfollowing, the limit, and finding a followed deck the
// learner may study right now.
//
// It deliberately does NOT pick cards or save answers (lib/decks and
// /api/flashcards do, with the same rule for followed decks), and it never
// lets anyone change the original.

import { prisma } from "@/lib/prisma";
import { DECK_LIMITS } from "@/lib/deckSchemas";
import { LISTED, LimitReached, lockUser } from "@/lib/decks";

type Result = { ok: true } | { error: string };

export async function followDeck(userId: string, deckId: string): Promise<Result> {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, ...LISTED }, select: { ownerId: true } });
  if (!deck) return { error: "This deck is not in the library any more. Go back and pick another." };
  if (deck.ownerId === userId) return { error: "This is your own deck. Study it from My decks." };
  try {
    // Count and insert under one per-user lock, so parallel taps cannot all
    // pass the limit before any of them has saved a follow.
    await prisma.$transaction(
      async (tx) => {
        await lockUser(tx, userId);
        if (await tx.deckFollow.findUnique({ where: { userId_deckId: { userId, deckId } }, select: { id: true } })) return;
        if ((await tx.deckFollow.count({ where: { userId } })) >= DECK_LIMITS.followsPerUser) throw new LimitReached();
        await tx.deckFollow.create({ data: { userId, deckId } });
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
  } catch (e) {
    if (e instanceof LimitReached) return { error: `You follow ${DECK_LIMITS.followsPerUser} decks, the most allowed. Unfollow one you no longer study, then try again.` };
    throw e;
  }
  return { ok: true };
}

/// Progress on the deck's cards is kept, so following again later picks up
/// where the learner stopped.
export async function unfollowDeck(userId: string, deckId: string): Promise<Result> {
  await prisma.deckFollow.deleteMany({ where: { userId, deckId } });
  return { ok: true };
}

/// The followed deck, if it may be studied now: followed by this user and
/// still in the library. Null for a deck back in review after an edit, too.
export async function studyableFollowedDeck(userId: string, deckId: string) {
  return prisma.deck.findFirst({ where: { id: deckId, ...LISTED, follows: { some: { userId } } }, select: { id: true, title: true } });
}

export async function isFollowing(userId: string, deckId: string): Promise<boolean> {
  return (await prisma.deckFollow.count({ where: { userId, deckId } })) > 0;
}
