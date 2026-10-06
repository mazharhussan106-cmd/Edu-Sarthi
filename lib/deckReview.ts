// Owns the public-library life cycle of a deck: the owner asking to publish,
// the admin approving or rejecting, readers reporting, and the admin acting on
// reports. Every state change lives here so the rules cannot drift between the
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
import { DECK_LIMITS } from "@/lib/deckSchemas";

type Result = { ok: true } | { error: string };

export async function publishDeck(userId: string, id: string): Promise<Result> {
  const deck = await prisma.deck.findFirst({
    where: { id, ownerId: userId },
    select: { status: true, visibility: true, description: true, owner: { select: { role: true, teacherVerifiedAt: true } }, _count: { select: { cards: true } } },
  });
  if (!deck) return { error: "That deck no longer exists." };
  // A teacher's deck carries their name's weight in the library, so an admin
  // vouches for the teacher first. Students and admins are not held to this.
  if (deck.owner.role === "TEACHER" && !deck.owner.teacherVerifiedAt) {
    return { error: "An admin needs to verify your teacher account before you can publish. Ask them to verify you, then submit again." };
  }
  if (deck.visibility === "PUBLIC" && deck.status !== "REJECTED") return { error: "This deck is already waiting for review or published." };
  if (deck._count.cards < DECK_LIMITS.minCardsToPublish) {
    return { error: `Add at least ${DECK_LIMITS.minCardsToPublish} cards before submitting — it is the minimum for the public library.` };
  }
  await prisma.deck.updateMany({
    where: { id, ownerId: userId },
    data: { visibility: "PUBLIC", status: "PENDING_REVIEW", rejectReason: null, reviewedById: null, reviewedAt: null },
  });
  return { ok: true };
}

/// Back to private (or link-only, if the link is on). Also how an owner pulls
/// a deck out of the queue or off the library.
export async function unpublishDeck(userId: string, id: string): Promise<Result> {
  const deck = await prisma.deck.findFirst({ where: { id, ownerId: userId }, select: { shareToken: true } });
  if (!deck) return { error: "That deck no longer exists." };
  await prisma.deck.updateMany({
    where: { id, ownerId: userId },
    data: { visibility: deck.shareToken ? "LINK" : "PRIVATE", status: "DRAFT", rejectReason: null },
  });
  return { ok: true };
}

/// Called after any edit to a deck's text or cards. A published deck that
/// changes goes back to review, or approval would only prove what the deck
/// looked like on one day. Rejected and draft decks are left alone.
export async function sendBackIfPublished(deckId: string): Promise<void> {
  await prisma.deck.updateMany({
    where: { id: deckId, visibility: "PUBLIC", status: "APPROVED" },
    data: { status: "PENDING_REVIEW", reviewedAt: null, reviewedById: null },
  });
}

export async function reviewDeck(adminId: string, id: string, decision: "approve" | "reject", reason: string): Promise<Result> {
  const deck = await prisma.deck.findFirst({ where: { id, visibility: "PUBLIC", status: "PENDING_REVIEW" }, select: { title: true } });
  if (!deck) return { error: "That deck is not waiting for review any more. Refresh the page." };
  const approve = decision === "approve";
  await prisma.deck.updateMany({
    // Same condition again: two admins clicking at once decide it only once.
    where: { id, visibility: "PUBLIC", status: "PENDING_REVIEW" },
    data: approve
      ? { status: "APPROVED", rejectReason: null, reviewedById: adminId, reviewedAt: new Date() }
      : { status: "REJECTED", rejectReason: reason, reviewedById: adminId, reviewedAt: new Date() },
  });
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
    await prisma.deck.update({ where: { id: deckId }, data: { visibility: "PRIVATE", shareToken: null, status: "REJECTED", rejectReason: reason, reviewedById: adminId, reviewedAt: now } });
  } else if (deck.status === "PENDING_REVIEW") {
    // Auto-hidden by reports and found fine: back into the library.
    await prisma.deck.updateMany({ where: { id: deckId, visibility: "PUBLIC", status: "PENDING_REVIEW" }, data: { status: "APPROVED", reviewedById: adminId, reviewedAt: now } });
  }
  await logAdmin(adminId, outcome === "takedown" ? "Took down reported deck" : "Dismissed deck reports", "deck", deckId, { title: deck.title, ...(outcome === "takedown" ? { reason } : {}) });
  return { ok: true };
}
