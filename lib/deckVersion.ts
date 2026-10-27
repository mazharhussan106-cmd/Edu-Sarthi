// Owns a published deck's new version (owner's decision: the approved version
// stays live while a big edit waits for review). A new version is a private
// working copy (Deck.draftOfId) whose cards remember their live card
// (Word.liveWordId). Approving it copies the changes onto the same live cards,
// so followers keep their progress; then the working copy is deleted.
//
// It deliberately does NOT check who is calling: the deck routes scope by
// owner, the admin route by admin. Discarding a version is an ordinary
// deleteDeck (lib/decks), which keeps the files the live deck still uses.

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { removeObjects } from "@/lib/storage";
import { cardText, lockUser, mediaKeys, newCardCode, unusedKeys } from "@/lib/decks";

type Result<T = object> = ({ ok: true } & T) | { error: string };

/// A deck in the library that changes through small fixes or a new version,
/// never directly. A working copy itself is never live.
export function isLive(d: { visibility: string; status: string; draftOfId: string | null }): boolean {
  return d.visibility === "PUBLIC" && d.status === "APPROVED" && !d.draftOfId;
}

const VERSION_CARD = { id: true, kind: true, text: true, category: true, details: true, imageUrl: true, audioUrl: true, videoUrl: true, serial: true, liveWordId: true } satisfies Prisma.WordSelect;
type VersionCard = Prisma.WordGetPayload<{ select: typeof VERSION_CARD }>;

/// Opens the deck's new version, making it first if there is none. Pictures
/// and audio are shared with the live deck rather than copied: instant, and
/// no extra storage; unusedKeys keeps a shared file until neither uses it.
export async function startVersion(userId: string, liveId: string): Promise<Result<{ id: string }>> {
  const live = await prisma.deck.findFirst({
    where: { id: liveId, ownerId: userId, draftOfId: null },
    select: { title: true, description: true, tags: true, visibility: true, status: true, draftOfId: true, sourceDeckId: true, sourceCredit: true, sourceLicence: true, cards: { orderBy: { serial: "asc" }, select: VERSION_CARD } },
  });
  if (!live) return { error: "That deck no longer exists." };
  if (!isLive(live)) return { error: "Only a published deck gets a new version. Edit this one directly." };
  if (live.cards.some((c) => cardText(c).rich)) return { error: "This deck came from an Excel file. Change the sheet and upload it again instead." };

  const id = await prisma.$transaction(
    async (tx) => {
      // One new version per deck: two taps at once must not make two.
      await lockUser(tx, liveId);
      const existing = await tx.deck.findFirst({ where: { draftOfId: liveId }, select: { id: true } });
      if (existing) return existing.id;
      const draft = await tx.deck.create({
        data: { ownerId: userId, title: live.title, description: live.description, tags: live.tags, draftOfId: liveId, sourceDeckId: live.sourceDeckId, sourceCredit: live.sourceCredit, sourceLicence: live.sourceLicence },
        select: { id: true },
      });
      await tx.word.createMany({
        data: live.cards.map((c) => ({
          code: newCardCode(),
          serial: c.serial,
          kind: c.kind,
          deckId: draft.id,
          ownerId: userId,
          text: c.text,
          category: c.category,
          details: (c.details ?? {}) as Prisma.InputJsonObject,
          imageUrl: c.imageUrl,
          audioUrl: c.audioUrl,
          videoUrl: c.videoUrl,
          liveWordId: c.id,
        })),
      });
      return draft.id;
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
  return { ok: true, id };
}

const same = (a: VersionCard, b: VersionCard) =>
  a.text === b.text && a.category === b.category && a.serial === b.serial && a.imageUrl === b.imageUrl && a.audioUrl === b.audioUrl && a.videoUrl === b.videoUrl && JSON.stringify(a.details) === JSON.stringify(b.details);

/// Which working-copy cards are new, which live cards they change, and which
/// live cards the version drops.
function compare(draft: VersionCard[], live: VersionCard[]) {
  const liveById = new Map(live.map((c) => [c.id, c]));
  const mapped = draft.filter((c) => c.liveWordId && liveById.has(c.liveWordId));
  const kept = new Set(mapped.map((c) => c.liveWordId));
  return {
    added: draft.filter((c) => !c.liveWordId || !liveById.has(c.liveWordId)),
    changed: mapped.filter((c) => !same(c, liveById.get(c.liveWordId!)!)),
    removed: live.filter((c) => !kept.has(c.id)),
    liveById,
  };
}

/// For the admin's review page: "3 added, 2 changed, 1 removed".
export async function versionSummary(draftId: string) {
  const draft = await prisma.deck.findUnique({
    where: { id: draftId },
    select: { cards: { select: VERSION_CARD }, draftOf: { select: { id: true, title: true, visibility: true, status: true, cards: { select: VERSION_CARD } } } },
  });
  if (!draft?.draftOf) return null;
  const { added, changed, removed } = compare(draft.cards, draft.draftOf.cards);
  const live = draft.draftOf;
  return { liveId: live.id, liveTitle: live.title, liveListed: live.visibility === "PUBLIC" && live.status === "APPROVED", added: added.length, changed: changed.length, removed: removed.length };
}

/// Applies an approved version to its live deck. Only cards that really
/// changed are written, so a typical version is a handful of statements.
/// Approval publishes the result, even if the live deck had been withdrawn:
/// the admin approved exactly this content.
export async function mergeVersion(adminId: string, draftId: string): Promise<Result<{ liveId: string; title: string }>> {
  const draft = await prisma.deck.findUnique({
    where: { id: draftId },
    select: { title: true, description: true, tags: true, licence: true, termsVersion: true, termsAcceptedAt: true, draftOfId: true, cards: { select: VERSION_CARD } },
  });
  if (!draft?.draftOfId) return { error: "That version no longer exists. Refresh the page." };
  const liveId = draft.draftOfId;
  const live = await prisma.deck.findUnique({ where: { id: liveId }, select: { cards: { select: VERSION_CARD } } });
  if (!live) return { error: "The deck this version belongs to was deleted. Reject it instead." };
  const { added, changed, removed, liveById } = compare(draft.cards, live.cards);

  // Files the live deck stops using; deleted after commit, and only if no card
  // (the working copy's included, until it is gone) still points at them.
  const replaced = [
    ...changed.flatMap((c) => {
      const old = liveById.get(c.liveWordId!)!;
      return mediaKeys([{ imageUrl: old.imageUrl !== c.imageUrl ? old.imageUrl : null, audioUrl: old.audioUrl !== c.audioUrl ? old.audioUrl : null }]);
    }),
    ...mediaKeys(removed),
  ];

  await prisma.$transaction(
    async (tx) => {
      for (const c of changed) {
        await tx.word.update({
          where: { id: c.liveWordId! },
          data: { text: c.text, category: c.category, details: (c.details ?? {}) as Prisma.InputJsonObject, imageUrl: c.imageUrl, audioUrl: c.audioUrl, videoUrl: c.videoUrl, serial: c.serial },
        });
      }
      if (added.length) await tx.word.updateMany({ where: { id: { in: added.map((c) => c.id) } }, data: { deckId: liveId, liveWordId: null } });
      if (removed.length) await tx.word.deleteMany({ where: { id: { in: removed.map((c) => c.id) }, deckId: liveId } });
      await tx.deck.update({
        where: { id: liveId },
        data: {
          title: draft.title, description: draft.description, tags: draft.tags,
          licence: draft.licence, termsVersion: draft.termsVersion, termsAcceptedAt: draft.termsAcceptedAt,
          visibility: "PUBLIC", status: "APPROVED", rejectReason: null, reviewedById: adminId, reviewedAt: new Date(),
        },
      });
      // The rest of the working copy (its matched cards) goes with it.
      await tx.deck.delete({ where: { id: draftId } });
    },
    // Longer than the usual 20 s: a version that rewrites many cards writes each one.
    { maxWait: 10_000, timeout: 60_000 },
  );
  await removeObjects(await unusedKeys(replaced));
  return { ok: true, liveId, title: draft.title };
}
