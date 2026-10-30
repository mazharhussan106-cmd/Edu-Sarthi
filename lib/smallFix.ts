// Owns small fixes on a published deck (owner's decision): text of existing
// cards only, at most 30 characters changed per field, one fix per card per
// day, at most 10 cards a day per deck. A small fix goes live at once and is
// logged (DeckChange) for the admin to Accept or Undo afterwards.
//
// It deliberately does NOT handle bigger changes — those go into a new version
// (lib/deckVersion) — and does not check who is calling: the cards route has
// already scoped the deck to its owner, and the admin route to an admin.

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logAdmin } from "@/lib/admin";
import { istDayStart } from "@/lib/aiLimits";
import { DECK_LIMITS } from "@/lib/deckSchemas";
import { cardText, lockUser } from "@/lib/decks";
import { sendFixUndone } from "@/lib/email";
import { notify } from "@/lib/notifications";

export type FixText = { front: string; back: string; example: string; body: string };
type Stored = { text: string; details: Prisma.JsonValue };
type Result = { ok: true } | { error: string };

const LABEL: Record<keyof FixText, string> = { front: "Front", back: "Back", example: "Example", body: "Notes" };
const FIELDS = Object.keys(LABEL) as (keyof FixText)[];

export function fixText(c: Stored): FixText {
  const t = cardText(c);
  return { front: c.text, back: t.back, example: t.example, body: t.body };
}

/// Edit distance (letters added, removed or swapped) at most `max`. Worked in
/// a band around the diagonal, so a 2,000-character note costs a few
/// thousand steps per row, not millions overall.
export function withinEdits(a: string, b: string, max: number): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > max) return false;
  const far = max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => (j <= max ? j : far));
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(far);
    cur[0] = i <= max ? i : far;
    let best = cur[0];
    for (let j = Math.max(1, i - max); j <= Math.min(b.length, i + max); j++) {
      cur[j] = Math.min(prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), prev[j] + 1, cur[j - 1] + 1, far);
      best = Math.min(best, cur[j]);
    }
    if (best > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

/// Why this edit is too big to be a small fix, or null if it is small. Media,
/// video and the teacher's guide only change in a new version.
export function bigReason(changesMedia: boolean, before: FixText, after: FixText): string | null {
  if (changesMedia) return "Pictures, audio, video and the teacher’s guide change only in a new version.";
  for (const f of FIELDS) {
    if (!withinEdits(before[f], after[f], DECK_LIMITS.smallFixChars)) return `“${LABEL[f]}” changed by more than ${DECK_LIMITS.smallFixChars} characters.`;
  }
  return null;
}

/// Saves the fix on the live card and logs it, under a per-deck lock so two
/// fixes at once cannot both slip under the daily limits.
export async function applySmallFix(userId: string, deckId: string, wordId: string, before: FixText, after: FixText): Promise<Result> {
  const changed = FIELDS.filter((f) => before[f] !== after[f]);
  if (!changed.length) return { ok: true };
  return prisma.$transaction(
    async (tx) => {
      await lockUser(tx, deckId);
      const today = await tx.deckChange.findMany({ where: { deckId, createdAt: { gte: istDayStart() } }, select: { wordId: true } });
      if (today.some((r) => r.wordId === wordId)) return { error: "This card already had its small fix today. Try again tomorrow, or start a new version for more changes." };
      if (new Set(today.map((r) => r.wordId)).size >= DECK_LIMITS.smallFixCardsPerDay) {
        return { error: `${DECK_LIMITS.smallFixCardsPerDay} cards in this deck were already fixed today. Try again tomorrow, or start a new version.` };
      }
      const card = await tx.word.findUniqueOrThrow({ where: { id: wordId }, select: { details: true } });
      const details = { ...(card.details && typeof card.details === "object" ? (card.details as Prisma.JsonObject) : {}), meaning: after.back, example: after.example, body: after.body };
      await tx.word.update({ where: { id: wordId }, data: { text: after.front, details } });
      await tx.deckChange.create({
        data: {
          deckId,
          wordId,
          editorId: userId,
          before: Object.fromEntries(changed.map((f) => [f, before[f]])),
          after: Object.fromEntries(changed.map((f) => [f, after[f]])),
        },
      });
      return { ok: true as const };
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
}

export async function acceptFix(adminId: string, id: string): Promise<Result> {
  const res = await prisma.deckChange.updateMany({ where: { id, reviewedAt: null }, data: { reviewedAt: new Date(), reviewedById: adminId } });
  if (!res.count) return { error: "That fix was already checked. Refresh the page." };
  await logAdmin(adminId, "Accepted small fix", "deckChange", id, {});
  return { ok: true };
}

/// Puts back what the fix replaced — only if the card still reads as the fix
/// left it. If the creator changed it again since, the admin decides by hand
/// rather than this silently throwing a newer edit away.
export async function undoFix(adminId: string, id: string, reason: string): Promise<Result> {
  const ch = await prisma.deckChange.findUnique({
    where: { id },
    select: { reviewedAt: true, before: true, after: true, wordId: true, deckId: true, word: { select: { text: true, details: true } }, deck: { select: { title: true, ownerId: true, owner: { select: { email: true } } } } },
  });
  if (!ch || ch.reviewedAt) return { error: "That fix was already checked. Refresh the page." };
  const now = fixText(ch.word);
  const before = ch.before as Partial<FixText>;
  const after = ch.after as Partial<FixText>;
  const keys = FIELDS.filter((f) => f in before);
  if (keys.some((f) => now[f] !== after[f])) return { error: "This card was changed again after the fix. Open the deck and correct it by hand, or reject its next version." };
  const restored = { ...now, ...before };
  const details = { ...(ch.word.details && typeof ch.word.details === "object" ? (ch.word.details as Prisma.JsonObject) : {}), meaning: restored.back, example: restored.example, body: restored.body };
  await prisma.$transaction([
    prisma.word.update({ where: { id: ch.wordId }, data: { text: restored.front, details } }),
    prisma.deckChange.update({ where: { id }, data: { reviewedAt: new Date(), reviewedById: adminId, undone: true, undoReason: reason } }),
  ]);
  await logAdmin(adminId, "Undid small fix", "deck", ch.deckId, { card: restored.front, reason });
  // Best effort, after the undo is saved: a failure must not undo the undo.
  await notify(ch.deck.ownerId, "fix_undone", {
    title: "A fix in your deck was undone",
    body: `An admin undid your fix to the card “${restored.front.slice(0, 80)}” in “${ch.deck.title}”. Reason: ${reason}`,
    link: `/decks/${ch.deckId}`,
  });
  try {
    if (ch.deck.owner.email) await sendFixUndone(ch.deck.owner.email, ch.deck.title, restored.front, reason);
  } catch {
    console.error("Could not send the fix-undone email");
  }
  return { ok: true };
}
