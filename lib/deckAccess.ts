// Owns who may do what with a deck: the owner manages it (publish, share,
// delete, people, versions); an editor it is shared with may change its cards
// and details; a viewer may read, study and copy it. A new version's working
// copy is shared with the live deck's editors only — viewers see what is
// published, not edits in progress.
//
// It deliberately does NOT read cards or write anything. The WHERE helpers put
// the permission inside the query itself, so a deck someone may not use is
// never fetched and compared afterwards.

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type DeckRoleFor = "OWNER" | "EDIT" | "VIEW";

const accepted = (userId: string) => ({ userId, acceptedAt: { not: null } }) satisfies Prisma.DeckMemberWhereInput;
const editor = (userId: string) => ({ ...accepted(userId), role: "EDIT" as const }) satisfies Prisma.DeckMemberWhereInput;

/// Decks this user may change cards and details of.
export function editableBy(userId: string): Prisma.DeckWhereInput {
  return { OR: [{ ownerId: userId }, { draftOfId: null, members: { some: editor(userId) } }, { draftOf: { members: { some: editor(userId) } } }] };
}

/// Decks this user may read, study and copy: their own and any shared with
/// them. Working copies only for their editors.
export function readableBy(userId: string): Prisma.DeckWhereInput {
  return { OR: [{ ownerId: userId }, { draftOfId: null, members: { some: accepted(userId) } }, { draftOf: { members: { some: editor(userId) } } }] };
}

/// The deck and this user's role on it, or null if they may not see it.
/// `termsAccepted` matters only for an editor of a public deck (canEditNow).
export async function deckAccess(userId: string, deckId: string) {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, ...readableBy(userId) },
    select: { id: true, ownerId: true, title: true, visibility: true, status: true, draftOfId: true, sourceLicence: true },
  });
  if (!deck) return null;
  if (deck.ownerId === userId) return { deck, role: "OWNER" as DeckRoleFor, termsAccepted: true };
  const m = await prisma.deckMember.findFirst({ where: { deckId: deck.draftOfId ?? deck.id, ...accepted(userId) }, select: { role: true, termsAcceptedAt: true } });
  if (!m) return null;
  return { deck, role: (m.role === "EDIT" ? "EDIT" : "VIEW") as DeckRoleFor, termsAccepted: Boolean(m.termsAcceptedAt) };
}

/// What an editor adds to a deck in the library (or to its new version) is
/// published under CC BY-SA and may be used in paid features, so an editor
/// there must have said they are 18 or older and accepted the library terms
/// (owner's decisions 5 and 12). Null when they may edit now.
export function editBlock(access: NonNullable<Awaited<ReturnType<typeof deckAccess>>>): string | null {
  if (access.role === "VIEW") return "This deck is shared with you to view, not to edit. Ask its owner to make you an editor.";
  const publicContext = access.deck.visibility === "PUBLIC" || Boolean(access.deck.draftOfId);
  if (access.role === "EDIT" && publicContext && !access.termsAccepted) {
    return "This deck is in the public library. Open it and confirm you are 18 or older and accept the library terms, then you can edit it.";
  }
  return null;
}
