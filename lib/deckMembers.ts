// Owns sharing a deck with named people (owner's decisions 7, 12 and 15):
// the owner invites by email to view or edit; the person accepts or declines
// from My decks, signed in with that email; the owner can remove them and they
// can leave. Editors of a deck in the public library confirm they are 18 or
// older and accept the library terms before they can edit it.
//
// It deliberately does NOT check reading or editing rights on cards — that is
// lib/deckAccess — and never says whether an email has an account: an invite
// to a new address simply waits for someone to sign up with it.

import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/appUrl";
import { istDayStart } from "@/lib/aiLimits";
import { DECK_LIMITS } from "@/lib/deckSchemas";
import { LimitReached, lockUser } from "@/lib/decks";
import { sendDeckInvite } from "@/lib/email";
import { notify } from "@/lib/notifications";

type Result = { ok: true } | { error: string };

export async function inviteMember(ownerId: string, deckId: string, email: string, role: "VIEW" | "EDIT"): Promise<Result> {
  // A working copy is shared through its live deck, so invites go there.
  const deck = await prisma.deck.findFirst({ where: { id: deckId, ownerId, draftOfId: null }, select: { title: true, owner: { select: { email: true, name: true } } } });
  if (!deck) return { error: "That deck no longer exists." };
  if (deck.owner.email === email) return { error: "That is your own email. Invite someone else." };
  let fresh = false;
  try {
    await prisma.$transaction(
      async (tx) => {
        // Under the owner's lock, so parallel invites cannot pass the limits together.
        await lockUser(tx, ownerId);
        const existing = await tx.deckMember.findUnique({ where: { deckId_email: { deckId, email } }, select: { id: true } });
        // Inviting the same address again changes their role; no second email.
        if (existing) return void (await tx.deckMember.update({ where: { id: existing.id }, data: { role } }));
        if ((await tx.deckMember.count({ where: { deckId } })) >= DECK_LIMITS.membersPerDeck) throw new LimitReached("members");
        if ((await tx.deckMember.count({ where: { invitedById: ownerId, createdAt: { gte: istDayStart() } } })) >= DECK_LIMITS.invitesPerDay) throw new LimitReached("day");
        await tx.deckMember.create({ data: { deckId, email, role, invitedById: ownerId } });
        fresh = true;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
  } catch (e) {
    if (e instanceof LimitReached) {
      return { error: e.message === "members" ? `A deck can be shared with ${DECK_LIMITS.membersPerDeck} people. Remove someone first.` : `You have sent ${DECK_LIMITS.invitesPerDay} invitations today. Try again tomorrow.` };
    }
    throw e;
  }
  // Best effort, after the invite is saved: it also waits in their My decks.
  if (fresh) {
    const from = deck.owner.name?.trim() || "Someone on EduSarthi";
    try {
      // The inbox note goes only to an account that has proven this address,
      // the same match invitationsFor uses. The owner sees the same answer
      // either way, so this reveals nothing about who has an account.
      // A failed lookup only loses the inbox note; the email below still goes.
      const invitee = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } }).catch(() => null);
      if (invitee?.emailVerified) {
        await notify(invitee.id, "deck_invite", {
          title: "You are invited to a deck",
          body: `${from} invited you to ${role === "EDIT" ? "edit" : "view"} “${deck.title}”. Accept or decline it in My decks.`,
          link: "/decks",
        });
      }
      await sendDeckInvite(email, from, deck.title, role, `${appUrl()}/decks`);
    } catch {
      console.error("Could not send the deck invitation email");
    }
  }
  return { ok: true };
}

/// Invitations waiting for this person: matched on their verified email.
export async function invitationsFor(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!me?.email || !me.emailVerified) return [];
  return prisma.deckMember.findMany({
    where: { email: me.email, userId: null, deck: { draftOfId: null, ownerId: { not: userId } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, role: true, deck: { select: { title: true, visibility: true, owner: { select: { name: true } } } } },
  });
}

export async function acceptInvite(userId: string, memberId: string, adult: boolean, terms: boolean): Promise<Result> {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true, adultConfirmedAt: true } });
  if (!me?.email || !me.emailVerified) return { error: "Verify your email first, then accept the invitation." };
  const inv = await prisma.deckMember.findFirst({ where: { id: memberId, email: me.email, userId: null }, select: { role: true, deck: { select: { visibility: true } } } });
  if (!inv) return { error: "That invitation is no longer open. Ask the owner to invite you again." };
  const needsTerms = inv.role === "EDIT" && inv.deck.visibility === "PUBLIC";
  if (needsTerms && (!(me.adultConfirmedAt || adult) || !terms)) {
    return { error: "This deck is in the public library. Tick that you are 18 or older and that you accept the library terms to edit it, or ask the owner to invite you to view it instead." };
  }
  const now = new Date();
  await prisma.$transaction([
    prisma.deckMember.updateMany({ where: { id: memberId, userId: null }, data: { userId, acceptedAt: now, ...(needsTerms ? { termsAcceptedAt: now } : {}) } }),
    ...(needsTerms && !me.adultConfirmedAt ? [prisma.user.update({ where: { id: userId }, data: { adultConfirmedAt: now } })] : []),
  ]);
  return { ok: true };
}

export async function declineInvite(userId: string, memberId: string): Promise<Result> {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (me?.email) await prisma.deckMember.deleteMany({ where: { id: memberId, email: me.email, userId: null } });
  return { ok: true };
}

/// An editor whose deck is (or is being prepared for) the public library
/// confirms here before editing it. deckId may be the working copy's.
export async function confirmEditing(userId: string, deckId: string, adult: boolean, terms: boolean): Promise<Result> {
  const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { id: true, draftOfId: true } });
  if (!deck) return { error: "That deck no longer exists." };
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { adultConfirmedAt: true } });
  if (!(me?.adultConfirmedAt || adult) || !terms) return { error: "Tick both boxes to edit a deck in the public library. Editing it is open from age 18." };
  const now = new Date();
  const res = await prisma.deckMember.updateMany({ where: { deckId: deck.draftOfId ?? deck.id, userId, role: "EDIT", acceptedAt: { not: null } }, data: { termsAcceptedAt: now } });
  if (!res.count) return { error: "You are not an editor of this deck any more." };
  if (!me?.adultConfirmedAt) await prisma.user.update({ where: { id: userId }, data: { adultConfirmedAt: now } });
  return { ok: true };
}

export async function removeMember(ownerId: string, memberId: string): Promise<Result> {
  await prisma.deckMember.deleteMany({ where: { id: memberId, deck: { ownerId } } });
  return { ok: true };
}

export async function leaveDeck(userId: string, deckId: string): Promise<Result> {
  await prisma.deckMember.deleteMany({ where: { deckId, userId } });
  return { ok: true };
}

/// Editors who have not yet accepted the library terms: the owner cannot
/// submit the deck until there are none (owner's decision).
export async function editorsWithoutTerms(deckId: string): Promise<number> {
  return prisma.deckMember.count({ where: { deckId, role: "EDIT", acceptedAt: { not: null }, termsAcceptedAt: null } });
}
