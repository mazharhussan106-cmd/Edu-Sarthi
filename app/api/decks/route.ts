// Owns a student's writes on their decks: create, rename, delete, the share
// link, copying a deck into their account, and asking for (or withdrawing)
// a place in the public library.
//
// Scoped to the signed-in student; the client never sends a user id, and every
// write names the owner in its WHERE clause.
//
// It deliberately does NOT touch cards (/api/decks/[id]/cards) or decide a
// review — approving is the admin route's job, via lib/deckReview.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { copyDeck, deleteDeck, LimitReached, lockUser, newShareToken, ownDeck, readJson } from "@/lib/decks";
import { instituteDeckScope } from "@/lib/institutes";
import { publishDeck, sendBackIfPublished, unpublishDeck } from "@/lib/deckReview";
import { DECK_LIMITS, deckActionSchema } from "@/lib/deckSchemas";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
const done = (r: { ok: true } | { error: string }) => ("error" in r ? fail(r.error, 400) : NextResponse.json({ ok: true }));

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true });
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
            if ((await tx.deck.count({ where: { ownerId: userId } })) >= DECK_LIMITS.decksPerUser) throw new LimitReached();
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
      return done(await publishDeck(userId, a.id));
    case "unpublish":
      return done(await unpublishDeck(userId, a.id));
  }

  const deck = await ownDeck(userId, a.id);
  if (!deck) return fail("That deck no longer exists.", 404);

  if (a.action === "update") {
    // Back to review first, then the edit: if the second step failed, approved
    // content must never be left changed without a fresh look.
    await sendBackIfPublished(a.id);
    await prisma.deck.updateMany({
      where: { id: a.id, ownerId: userId },
      data: { title: a.title, description: a.description || null, tags: a.tags },
    });
    return NextResponse.json({ ok: true });
  }

  // share: turning it off clears the token, which revokes every copy of the
  // link; turning it on again issues a fresh one rather than reviving the old.
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
