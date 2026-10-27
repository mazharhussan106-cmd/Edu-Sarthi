// Owns the public-library life cycle of a deck: the owner asking to publish
// (with the 18+ answer, the licence ticks, their name choice, and whether it
// goes out under their institute's name), the admin
// approving or rejecting, readers reporting, and the admin acting on reports. Every state change lives here so the rules cannot drift between the
// owner's route, the admin's route and the pages.
//
// The states (DeckStatus) are: DRAFT (never asked) → PENDING_REVIEW → APPROVED
// or REJECTED. Only APPROVED + PUBLIC decks appear in the library.
//
// It deliberately does NOT check who is calling — routes do that (an owner in
// the deck routes, requireAdmin in the admin route) and pass ids in. It does
// scope every owner write by ownerId.

import type { ReportReason } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logAdmin } from "@/lib/admin";
import { sendDeckDecision } from "@/lib/email";
import { DECK_LIMITS, type PublishConsent } from "@/lib/deckSchemas";
import { LIBRARY_TERMS_VERSION, LICENCES, licenceFor } from "@/lib/libraryTerms";
import { mergeVersion } from "@/lib/deckVersion";
import { editorsWithoutTerms } from "@/lib/deckMembers";
import { activeMembership } from "@/lib/institutes";

type Result = { ok: true } | { error: string };

export async function publishDeck(userId: string, id: string, consent: PublishConsent): Promise<Result> {
  const deck = await prisma.deck.findFirst({
    where: { id, ownerId: userId },
    select: {
      status: true,
      visibility: true,
      instituteId: true,
      description: true,
      sourceLicence: true,
      draftOfId: true,
      draftOf: { select: { instituteId: true } },
      owner: { select: { role: true, teacherVerifiedAt: true, name: true, adultConfirmedAt: true } },
      _count: { select: { cards: true } },
    },
  });
  if (!deck) return { error: "That deck no longer exists." };
  // Republishing it would hand EduSarthi's own material out under CC BY-SA.
  if (deck.sourceLicence === LICENCES.EDUSARTHI.id) {
    return { error: "This deck is a copy of an EduSarthi deck. You can keep studying it, but it cannot be published to the library." };
  }
  // What editors added goes public too, under the same licence: each must
  // have accepted the library terms first (owner's decision).
  const unconfirmed = await editorsWithoutTerms(deck.draftOfId ?? id);
  if (unconfirmed) {
    return { error: `${unconfirmed} editor${unconfirmed === 1 ? " has" : "s have"} not accepted the library terms yet. Ask them to open the deck and confirm, or remove them under People, then submit again.` };
  }
  // Owner's decision: under-18s may not publish. Asked once per account; the
  // form keeps sending it, but only the first "yes" is recorded.
  if (!deck.owner.adultConfirmedAt && !consent.adult) {
    return { error: "Publishing to the public library is open from age 18. You can still keep this deck private or share it by link." };
  }
  const style = consent.name.creditStyle;
  if ((style === "FULL_NAME" || style === "FIRST_NAME") && !deck.owner.name?.trim()) {
    return { error: "Your account has no name yet. Add it on your Profile page, or choose a display name or no name." };
  }
  // A teacher's deck carries their name's weight in the library, so an admin
  // vouches for the teacher first. Students and admins are not held to this.
  if (deck.owner.role === "TEACHER" && !deck.owner.teacherVerifiedAt) {
    return { error: "An admin needs to verify your teacher account before you can publish. Ask them to verify you, then submit again." };
  }
  if (deck.visibility === "PUBLIC" && deck.status !== "REJECTED") return { error: "This deck is already waiting for review or published." };
  // A new version keeps whatever name the published deck went out under; only
  // a first submission (or a resubmission) chooses.
  const choosing = !deck.draftOfId;
  if (choosing && deck.visibility === "INSTITUTE" && !consent.asInstitute) {
    return { error: "This deck is shared with your institute, so it goes to the library under the institute’s name. Choose that, or stop sharing it with the institute first to publish it as yourself." };
  }
  // Owner's decision: an institute's admin and its teachers may publish under
  // its name. Checked now, not when the form was drawn: a role can change.
  const member = choosing && consent.asInstitute ? await activeMembership(userId) : null;
  if (choosing && consent.asInstitute && (!member || member.role === "STUDENT")) {
    return { error: "Only an institute’s admin and teachers can publish under its name. Choose to publish it as yourself instead." };
  }
  if (member && deck.visibility === "INSTITUTE" && deck.instituteId !== member.institute.id) {
    return { error: "This deck is shared with a different institute. Stop sharing it there first, then submit again." };
  }
  if (deck._count.cards < DECK_LIMITS.minCardsToPublish) {
    return { error: `Add at least ${DECK_LIMITS.minCardsToPublish} cards before submitting — it is the minimum for the public library.` };
  }
  const now = new Date();
  // Together: a deck must never sit in the queue without the consent that
  // lets it be public, and the name choice is part of that consent.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        adultConfirmedAt: deck.owner.adultConfirmedAt ?? now,
        creditStyle: style,
        ...(style === "DISPLAY_NAME" ? { publicName: consent.name.publicName } : {}),
      },
    }),
    prisma.deck.updateMany({
      where: { id, ownerId: userId },
      data: {
        visibility: "PUBLIC",
        status: "PENDING_REVIEW",
        rejectReason: null,
        reviewedById: null,
        reviewedAt: null,
        licence: licenceFor(deck.owner.role, choosing ? Boolean(member) : Boolean(deck.draftOf?.instituteId)),
        ...(choosing ? { instituteId: member ? member.institute.id : null } : {}),
        termsVersion: LIBRARY_TERMS_VERSION,
        termsAcceptedAt: now,
      },
    }),
  ]);
  return { ok: true };
}

/// Back to private (or link-only, if the link is on). Also how an owner pulls
/// a deck out of the queue or off the library.
export async function unpublishDeck(userId: string, id: string): Promise<Result> {
  const deck = await prisma.deck.findFirst({ where: { id, ownerId: userId }, select: { shareToken: true, visibility: true } });
  if (!deck) return { error: "That deck no longer exists." };
  if (deck.visibility === "INSTITUTE") return { error: "This deck is shared with your institute, not the library. Use “Stop sharing” instead." };
  await prisma.deck.updateMany({
    where: { id, ownerId: userId },
    // Withdrawn means private, the same for an institute's deck: the
    // institute's name is no longer on it, and the owner may share it there again.
    data: { visibility: deck.shareToken ? "LINK" : "PRIVATE", status: "DRAFT", rejectReason: null, instituteId: null },
  });
  // Owner's decision: followers lose a deck its author withdraws. Their card
  // progress stays, in case it is published again and they follow it again.
  await prisma.deckFollow.deleteMany({ where: { deckId: id } });
  return { ok: true };
}

/// Best effort, after the decision is saved: a mail failure must never undo or
/// block an admin's decision. Accounts with no email (phone sign-ups) are
/// skipped; they see the status on the deck page.
async function tellOwner(deckId: string, outcome: "approved" | "rejected" | "removed", reason: string) {
  try {
    const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { title: true, owner: { select: { email: true } } } });
    if (deck?.owner.email) await sendDeckDecision(deck.owner.email, deck.title, outcome, reason);
  } catch {
    console.error("Could not send the deck decision email");
  }
}

export async function reviewDeck(adminId: string, id: string, decision: "approve" | "reject", reason: string): Promise<Result> {
  const deck = await prisma.deck.findFirst({ where: { id, visibility: "PUBLIC", status: "PENDING_REVIEW" }, select: { title: true, draftOfId: true } });
  if (!deck) return { error: "That deck is not waiting for review any more. Refresh the page." };
  const approve = decision === "approve";
  // A new version of a published deck: approving copies it onto the live deck
  // (same cards, so followers keep their progress) instead of publishing a
  // second deck. Rejecting it is the same as rejecting any deck below.
  if (approve && deck.draftOfId) {
    const merged = await mergeVersion(adminId, id);
    if ("error" in merged) return merged;
    await tellOwner(merged.liveId, "approved", "");
    await logAdmin(adminId, "Approved new version of a public deck", "deck", merged.liveId, { title: merged.title });
    return { ok: true };
  }
  await prisma.deck.updateMany({
    // Same condition again: two admins clicking at once decide it only once.
    where: { id, visibility: "PUBLIC", status: "PENDING_REVIEW" },
    data: approve
      ? { status: "APPROVED", rejectReason: null, reviewedById: adminId, reviewedAt: new Date() }
      // A rejected deck's link is switched off too, or the content the admin just
      // refused would stay readable by anyone who has it.
      : { status: "REJECTED", rejectReason: reason, reviewedById: adminId, reviewedAt: new Date(), shareToken: null },
  });
  await tellOwner(id, approve ? "approved" : "rejected", reason);
  await logAdmin(adminId, approve ? "Approved public deck" : "Rejected public deck", "deck", id, { title: deck.title, ...(approve ? {} : { reason }) });
  return { ok: true };
}

export async function reportDeck(userId: string, deckId: string, reason: ReportReason, note: string): Promise<Result> {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, visibility: "PUBLIC", status: "APPROVED" }, select: { ownerId: true } });
  if (!deck) return { error: "That deck is not in the library any more." };
  if (deck.ownerId === userId) return { error: "This is your own deck. Withdraw it from the library instead." };

  // One report per person; reporting again updates it and reopens it.
  await prisma.deckReport.upsert({
    where: { deckId_reporterId: { deckId, reporterId: userId } },
    create: { deckId, reporterId: userId, reason, note: note || null },
    update: { reason, note: note || null, resolvedAt: null, resolvedById: null },
  });
  const open = await prisma.deckReport.count({ where: { deckId, resolvedAt: null } });
  if (open >= DECK_LIMITS.reportsToHide) {
    // Pulled from the library until an admin looks, without waiting for one.
    await prisma.deck.updateMany({ where: { id: deckId, visibility: "PUBLIC", status: "APPROVED" }, data: { status: "PENDING_REVIEW", reviewedAt: null, reviewedById: null } });
  }
  return { ok: true };
}

/// dismiss: the reports were wrong, the deck stays. takedown: the deck leaves
/// the library, its share link stops, and the owner sees the reason.
export async function resolveReports(adminId: string, deckId: string, outcome: "dismiss" | "takedown", reason: string): Promise<Result> {
  const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { title: true, status: true } });
  if (!deck) return { error: "That deck no longer exists." };
  const now = new Date();
  await prisma.deckReport.updateMany({ where: { deckId, resolvedAt: null }, data: { resolvedAt: now, resolvedById: adminId } });
  if (outcome === "takedown") {
    await prisma.deck.update({ where: { id: deckId }, data: { visibility: "PRIVATE", shareToken: null, instituteId: null, status: "REJECTED", rejectReason: reason, reviewedById: adminId, reviewedAt: now } });
    await prisma.deckFollow.deleteMany({ where: { deckId } });
  } else if (deck.status === "PENDING_REVIEW") {
    // Auto-hidden by reports and found fine: back into the library.
    await prisma.deck.updateMany({ where: { id: deckId, visibility: "PUBLIC", status: "PENDING_REVIEW" }, data: { status: "APPROVED", reviewedById: adminId, reviewedAt: now } });
  }
  if (outcome === "takedown") await tellOwner(deckId, "removed", reason);
  await logAdmin(adminId, outcome === "takedown" ? "Took down reported deck" : "Dismissed deck reports", "deck", deckId, { title: deck.title, ...(outcome === "takedown" ? { reason } : {}) });
  return { ok: true };
}
