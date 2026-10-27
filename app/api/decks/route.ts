// Owns a student's writes on their decks: create, rename, delete, the share
// link, copying a deck into their account, following a library deck, asking
// for (or withdrawing) a place in the public library, and starting a new
// version of a published deck (lib/deckVersion).
//
// Scoped to the signed-in student; the client never sends a user id, and every
// write names the owner in its WHERE clause.
//
// It deliberately does NOT touch cards (/api/decks/[id]/cards) or decide a
// review — approving is the admin route's job, via lib/deckReview.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { deleteDeck, LimitReached, lockUser, newShareToken, ownDeck, readJson } from "@/lib/decks";
import { copyDeck } from "@/lib/deckCopy";
import { followDeck, unfollowDeck } from "@/lib/deckFollow";
import { LICENCES } from "@/lib/libraryTerms";
import { deckAccess, editBlock, editableBy } from "@/lib/deckAccess";
import { instituteDeckScope } from "@/lib/institutes";
import { publishDeck, unpublishDeck } from "@/lib/deckReview";
import { isLive, startVersion } from "@/lib/deckVersion";
import { DECK_LIMITS, deckActionSchema } from "@/lib/deckSchemas";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
const done = (r: { ok: true } | { error: string }) => ("error" in r ? fail(r.error, 400) : NextResponse.json({ ok: true }));

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  const parsed = deckActionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Could not save that. Check the fields and try again.", 400);
  const a = parsed.data;

  switch (a.action) {
    case "create": {
      // Count and insert under one per-user lock, so parallel requests cannot all
      // pass the limit before any of them has created a deck.
      try {
        const deck = await prisma.$transaction(
          async (tx) => {
            await lockUser(tx, userId);
            // A new version (working copy) is not one of the person's decks.
            if ((await tx.deck.count({ where: { ownerId: userId, draftOfId: null } })) >= DECK_LIMITS.decksPerUser) throw new LimitReached();
            return tx.deck.create({ data: { ownerId: userId, title: a.title, description: a.description || null, tags: a.tags }, select: { id: true } });
          },
          { maxWait: 10_000, timeout: 20_000 },
        );
        return NextResponse.json({ ok: true, id: deck.id });
      } catch (e) {
        if (e instanceof LimitReached) return fail(`You can have ${DECK_LIMITS.decksPerUser} decks. Delete one you no longer need, then try again.`, 400);
        throw e;
      }
    }
    case "copy":
    case "copyPublic": {
      // A link copies whatever the link points at; the library copies only
      // decks an admin has approved.
      const where = a.action === "copy" ? { shareToken: a.token } : { id: a.deckId, visibility: "PUBLIC" as const, status: "APPROVED" as const };
      const res = await copyDeck(userId, where);
      return "error" in res ? fail(res.error, 400) : NextResponse.json({ ok: true, id: res.id });
    }
    case "copyMember": {
      // A deck shared with this person by name, to view or edit.
      const res = await copyDeck(userId, { id: a.deckId, draftOfId: null, members: { some: { userId, acceptedAt: { not: null } } } });
      return "error" in res ? fail(res.error, 400) : NextResponse.json({ ok: true, id: res.id });
    }
    case "copyInstitute": {
      // Only members of an approved institute, and only decks shared with it.
      const scope = await instituteDeckScope(userId);
      if (!scope) return fail("You are not in an active institute.", 403);
      const res = await copyDeck(userId, { id: a.deckId, ...scope });
      return "error" in res ? fail(res.error, 400) : NextResponse.json({ ok: true, id: res.id });
    }
    case "delete":
      return (await deleteDeck(userId, a.id)) ? NextResponse.json({ ok: true }) : fail("That deck no longer exists.", 404);
    case "publish":
      return done(await publishDeck(userId, a.id, a.consent));
    case "unpublish":
      return done(await unpublishDeck(userId, a.id));
    case "follow":
      return done(await followDeck(userId, a.deckId));
    case "unfollow":
      return done(await unfollowDeck(userId, a.deckId));
    case "startVersion": {
      const res = await startVersion(userId, a.id);
      return "error" in res ? fail(res.error, 400) : NextResponse.json({ ok: true, id: res.id });
    }
  }

  if (a.action === "update") {
    // The owner, or an editor the deck is shared with.
    const access = await deckAccess(userId, a.id);
    if (!access) return fail("That deck no longer exists.", 404);
    const blocked = editBlock(access);
    if (blocked) return fail(blocked, 403);
    // The library must keep showing what an admin approved: a published deck's
    // name, description and tags change only in a new version.
    if (isLive(access.deck)) return fail("This deck is published. Start a new version to change its name, description or tags; the current version stays live while it is reviewed.", 400);
    await prisma.deck.updateMany({
      where: { id: a.id, ...editableBy(userId) },
      data: { title: a.title, description: a.description || null, tags: a.tags },
    });
    return NextResponse.json({ ok: true });
  }

  // Everything below (the share link) is the owner's alone.
  const deck = await ownDeck(userId, a.id);
  if (!deck) return fail("That deck no longer exists.", 404);

  // share: turning it off clears the token, which revokes every copy of the
  // link; turning it on again issues a fresh one rather than reviving the old.
  if (a.on && deck.draftOfId) return fail("This is a new version that is not published yet. Share the published deck instead.", 400);
  // A share link opens signed out, so it would put EduSarthi's own material in
  // front of anyone holding it.
  if (a.on && deck.sourceLicence === LICENCES.EDUSARTHI.id) return fail("This deck is a copy of an EduSarthi deck. You can keep studying it, but it cannot be shared by link.", 400);
  if (a.on && deck.visibility === "INSTITUTE") return fail("This deck is shared inside your institute only. Stop sharing it with the institute first if you want a link.", 400);
  if (a.on && deck.status === "REJECTED") return fail("An admin did not approve this deck, so it cannot be shared by link. Fix what the reviewer's note says and submit it again.", 400);
  if (a.on && deck.shareToken) return NextResponse.json({ ok: true, token: deck.shareToken });
  const token = a.on ? newShareToken() : null;
  await prisma.deck.updateMany({
    where: { id: a.id, ownerId: userId },
    // A deck in the library or an institute keeps its visibility; the link is only an extra
    // way in. Otherwise sharing would silently unpublish it.
    data: { shareToken: token, ...(deck.visibility === "PUBLIC" || deck.visibility === "INSTITUTE" ? {} : { visibility: a.on ? "LINK" : "PRIVATE" }) },
  });
  return NextResponse.json({ ok: true, token });
}
