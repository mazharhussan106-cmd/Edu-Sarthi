// Owns adding a guest's study into an existing student account, after the
// guest has proved they own that account's inbox (app/api/profile/
// guest-upgrade): their cards, then the guest row is deleted.
//
// A guest can only study flashcards, so cards (CardState) and their answer
// history (ReviewLog) are everything there is to move. For a card both have
// studied, the one with more reviews wins, and the account's own on a tie: it
// is the person's real account, and its schedule is the one they know. The
// account's settings are not touched.
//
// It deliberately does NOT sign anyone in. The guest's session dies with its
// row, and the person signs in to the account the usual way.

import { prisma } from "@/lib/prisma";

/// Who a guest may be merged into: a working student account. Teachers and
/// admins study nothing here, and a suspended account must stay as it is.
export async function mergeTarget(email: string) {
  const row = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, isGuest: true, suspendedAt: true } });
  if (!row) return { kind: "none" as const };
  if (row.role !== "STUDENT" || row.isGuest || row.suspendedAt) return { kind: "refused" as const };
  return { kind: "student" as const, id: row.id };
}

export async function mergeGuestInto(guestId: string, accountId: string): Promise<{ moved: number }> {
  return prisma.$transaction(
    async (tx) => {
      // The guest's copy goes where the account has studied the card at least
      // as much; then the account's goes where the guest studied it more.
      await tx.$executeRaw`DELETE FROM "CardState" g USING "CardState" a
        WHERE g."userId" = ${guestId} AND a."userId" = ${accountId} AND a."wordId" = g."wordId" AND a."reviews" >= g."reviews"`;
      await tx.$executeRaw`DELETE FROM "CardState" a USING "CardState" g
        WHERE a."userId" = ${accountId} AND g."userId" = ${guestId} AND a."wordId" = g."wordId"`;
      const moved = await tx.$executeRaw`UPDATE "CardState" SET "userId" = ${accountId} WHERE "userId" = ${guestId}`;
      await tx.$executeRaw`UPDATE "ReviewLog" SET "userId" = ${accountId} WHERE "userId" = ${guestId}`;
      // isGuest in the WHERE: whatever happens, this can only ever delete a
      // guest. Anything else rolls the whole move back.
      const { count } = await tx.user.deleteMany({ where: { id: guestId, isGuest: true } });
      if (count !== 1) throw new Error("Guest row was not deleted");
      return { moved };
    },
    // The pooler is slow to start a transaction; a guest with many cards is a
    // few statements, not a few thousand.
    { maxWait: 10_000, timeout: 20_000 },
  );
}
