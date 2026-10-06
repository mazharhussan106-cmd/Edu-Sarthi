// Owns what an institute is allowed to do: who belongs to which, who may manage
// it, how a deck is shared inside it, and the admin's approve / reject /
// suspend. The rules live here so the routes and pages cannot disagree.
//
// Every function takes the acting user's id and checks membership itself; a
// membership is looked up by userId (unique), so "my institute" has one answer.
//
// It deliberately does NOT parse requests (lib/instituteSchemas) or render
// anything. Institute decks are never offered to the public library.

import { randomInt } from "crypto";
import type { InstituteRole, InstituteStatus } from "@prisma/client";

import { logAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type Result = { ok: true } | { error: string };

// No 0/O/1/I: a code read aloud or copied from a whiteboard must not be
// ambiguous.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newJoinCode(): string {
  return Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export async function myMembership(userId: string) {
  return prisma.instituteMember.findUnique({
    where: { userId },
    select: { role: true, institute: { select: { id: true, name: true, status: true, statusNote: true, joinCode: true } } },
  });
}

/// The membership only if the institute is approved — what every feature but
/// the status page needs. A suspended institute stops working for everyone.
export async function activeMembership(userId: string) {
  const m = await myMembership(userId);
  return m && m.institute.status === "APPROVED" ? m : null;
}

export async function applyInstitute(userId: string, f: { name: string; description: string; contact: string }): Promise<Result> {
  const existing = await prisma.instituteMember.findUnique({ where: { userId }, select: { role: true, instituteId: true, institute: { select: { status: true } } } });
  if (existing) {
    // A rejected applicant may apply again: the old application is cleared so
    // they are free to join the new one. Anything else blocks.
    if (existing.role === "ADMIN" && existing.institute.status === "REJECTED") {
      await prisma.institute.delete({ where: { id: existing.instituteId } });
    } else {
      return { error: "You already belong to an institute. Leave it first if you want to apply for a new one." };
    }
  }
  // The applicant becomes its admin straight away so they can see the status of
  // the application; nothing works until the site admin approves it.
  await prisma.institute.create({
    data: { ...f, applicantId: userId, joinCode: newJoinCode(), members: { create: { userId, role: "ADMIN" } } },
  });
  return { ok: true };
}

export async function joinInstitute(userId: string, code: string): Promise<Result> {
  if (await prisma.instituteMember.findUnique({ where: { userId }, select: { id: true } })) {
    return { error: "You already belong to an institute. Leave it first to join another." };
  }
  const inst = await prisma.institute.findUnique({ where: { joinCode: code }, select: { id: true, status: true } });
  // Same message for a wrong code and an unapproved institute: the code is the
  // only thing that proves anyone should be told an institute exists.
  if (!inst || inst.status !== "APPROVED") return { error: "That code does not match an institute. Check it with your institute and try again." };
  await prisma.instituteMember.create({ data: { instituteId: inst.id, userId, role: "STUDENT" } });
  return { ok: true };
}

/// Takes a person out and pulls back any of their decks they shared there.
async function drop(userId: string, instituteId: string) {
  await prisma.instituteMember.deleteMany({ where: { userId, instituteId } });
  // Back to what the owner had before: link-only if a share link is on, else
  // private. Setting PRIVATE while keeping the link would hide the truth from
  // the owner — the deck would still open for anyone holding the link.
  await prisma.deck.updateMany({ where: { ownerId: userId, instituteId, shareToken: { not: null } }, data: { visibility: "LINK", instituteId: null } });
  await prisma.deck.updateMany({ where: { ownerId: userId, instituteId }, data: { visibility: "PRIVATE", instituteId: null } });
}

export async function leaveInstitute(userId: string): Promise<Result> {
  const m = await prisma.instituteMember.findUnique({ where: { userId }, select: { role: true, instituteId: true, institute: { select: { status: true } } } });
  if (!m) return { error: "You are not in an institute." };
  // An admin of a running institute cannot walk away from it, but one whose
  // institute was rejected or suspended is not stuck for ever.
  if (m.role === "ADMIN" && m.institute.status === "APPROVED") return { error: "You run this institute, so you cannot leave it. Ask the site admin to hand it over first." };
  await drop(userId, m.instituteId);
  return { ok: true };
}

async function asAdmin(userId: string) {
  const m = await prisma.instituteMember.findUnique({ where: { userId }, select: { role: true, instituteId: true, institute: { select: { status: true } } } });
  return m && m.role === "ADMIN" && m.institute.status === "APPROVED" ? m : null;
}

export async function removeMember(adminUserId: string, userId: string): Promise<Result> {
  const a = await asAdmin(adminUserId);
  if (!a) return { error: "Only the institute’s admin can do that." };
  if (userId === adminUserId) return { error: "You cannot remove yourself. Hand the institute over first." };
  // Scoped by institute: an admin can only touch their own members.
  const target = await prisma.instituteMember.findFirst({ where: { userId, instituteId: a.instituteId }, select: { id: true } });
  if (!target) return { error: "That person is not in your institute." };
  await drop(userId, a.instituteId);
  return { ok: true };
}

export async function setMemberRole(adminUserId: string, userId: string, role: InstituteRole): Promise<Result> {
  const a = await asAdmin(adminUserId);
  if (!a) return { error: "Only the institute’s admin can do that." };
  if (userId === adminUserId) return { error: "You cannot change your own role." };
  const res = await prisma.instituteMember.updateMany({ where: { userId, instituteId: a.instituteId, role: { not: "ADMIN" } }, data: { role } });
  return res.count ? { ok: true } : { error: "That person is not a member you can change." };
}

export async function rotateJoinCode(adminUserId: string): Promise<Result> {
  const a = await asAdmin(adminUserId);
  if (!a) return { error: "Only the institute’s admin can do that." };
  await prisma.institute.update({ where: { id: a.instituteId }, data: { joinCode: newJoinCode() } });
  return { ok: true };
}

/// Admins and teachers of an approved institute can share their own decks with
/// its members. The deck leaves any public state: institute decks stay inside.
export async function shareDeck(userId: string, deckId: string): Promise<Result> {
  const m = await activeMembership(userId);
  if (!m || m.role === "STUDENT") return { error: "Only an institute’s teachers and admin can share decks with it." };
  const deck = await prisma.deck.findFirst({ where: { id: deckId, ownerId: userId }, select: { visibility: true } });
  if (!deck) return { error: "That deck no longer exists." };
  if (deck.visibility === "PUBLIC") return { error: "This deck is in the public library. Remove it from there first — an institute deck stays inside the institute." };
  await prisma.deck.updateMany({ where: { id: deckId, ownerId: userId }, // The share link is switched off: "inside the institute" must mean it, and
    // a link would keep the deck open to anyone who holds it.
    data: { visibility: "INSTITUTE", instituteId: m.institute.id, status: "DRAFT", shareToken: null } });
  return { ok: true };
}

export async function unshareDeck(userId: string, deckId: string): Promise<Result> {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, ownerId: userId, visibility: "INSTITUTE" }, select: { shareToken: true } });
  if (!deck) return { error: "That deck is not shared with an institute." };
  await prisma.deck.updateMany({ where: { id: deckId, ownerId: userId }, data: { visibility: deck.shareToken ? "LINK" : "PRIVATE", instituteId: null } });
  return { ok: true };
}

/// Where-clause for decks a member may read: shared with their institute, and
/// the institute still approved.
export async function instituteDeckScope(userId: string) {
  const m = await activeMembership(userId);
  return m ? { visibility: "INSTITUTE" as const, instituteId: m.institute.id } : null;
}

export async function decideInstitute(
  adminId: string,
  id: string,
  action: "approve" | "reject" | "suspend" | "reinstate",
  reason: string,
): Promise<Result> {
  const inst = await prisma.institute.findUnique({ where: { id }, select: { name: true, status: true } });
  if (!inst) return { error: "That institute no longer exists." };
  const allowed: Record<typeof action, InstituteStatus[]> = {
    approve: ["PENDING"],
    reject: ["PENDING"],
    suspend: ["APPROVED"],
    reinstate: ["SUSPENDED"],
  };
  if (!allowed[action].includes(inst.status)) return { error: "That institute’s status has changed. Refresh the page." };
  const next: InstituteStatus = action === "approve" || action === "reinstate" ? "APPROVED" : action === "reject" ? "REJECTED" : "SUSPENDED";
  await prisma.institute.updateMany({
    // Same condition again: two admins clicking at once decide it only once.
    where: { id, status: inst.status },
    data: { status: next, statusNote: next === "APPROVED" ? null : reason, reviewedById: adminId, reviewedAt: new Date() },
  });
  await logAdmin(adminId, `Institute ${action}`, "institute", id, { name: inst.name, ...(reason ? { reason } : {}) });
  return { ok: true };
}
