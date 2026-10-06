// Owns a student's writes on a flashcard: marking it Known or Unknown (with
// the Hard / Medium / Easy level that sets the next review), and toggling a
// remark or saving a note — none of which moves the card on.
//
// Scoped to the signed-in student by the unique (userId, wordId) key; the
// client never sends a user id.

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { canStudyWord } from "@/lib/decks";
import { nextReview } from "@/lib/srs";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("mark"),
    wordId: z.string().min(1),
    known: z.boolean(),
    recall: z.enum(["HARD", "MEDIUM", "EASY"]).nullable(),
  }),
  z.object({
    action: z.literal("remark"),
    wordId: z.string().min(1),
    field: z.enum(["confident", "important", "favourite", "doubt"]),
    value: z.boolean(),
  }),
  z.object({
    action: z.literal("note"),
    wordId: z.string().min(1),
    note: z.string().trim().max(500, "Keep the note under 500 characters"),
  }),
]);

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Could not save that." }, { status: 400 });
  }
  const a = parsed.data;

  // Built-in cards and the student's own only. A card in someone else's deck
  // answers "no longer exists" so its existence is not revealed.
  if (!(await canStudyWord(userId, a.wordId))) {
    return NextResponse.json({ error: "That card no longer exists." }, { status: 404 });
  }

  const key = { userId_wordId: { userId, wordId: a.wordId } };

  if (a.action === "mark") {
    const current = await prisma.cardState.findUnique({ where: key, select: { stage: true, dueAt: true, reviews: true, lastReviewedAt: true } });
    const now = new Date();
    // A double-tap or a phone's automatic retry arrives within moments of the
    // first answer. Without this it would climb the ladder a second rung for
    // one real answer — a card could reach 60 days in three presses.
    if (current?.reviews && current.lastReviewedAt && now.getTime() - current.lastReviewedAt.getTime() < 8_000) {
      return NextResponse.json({ ok: true, dueAt: current.dueAt.toISOString() });
    }
    const next = nextReview(current, a.known, a.recall);
    const saved = await prisma.cardState.upsert({
      where: key,
      create: {
        userId,
        wordId: a.wordId,
        known: a.known,
        recall: a.recall,
        stage: next.stage,
        dueAt: next.dueAt,
        reviews: 1,
        lastReviewedAt: now,
      },
      update: {
        known: a.known,
        recall: a.recall,
        stage: next.stage,
        dueAt: next.dueAt,
        reviews: { increment: 1 },
        lastReviewedAt: now,
      },
      select: { dueAt: true },
    });
    return NextResponse.json({ ok: true, dueAt: saved.dueAt.toISOString() });
  }

  // A remark on a card the student has not marked yet creates its state. Due
  // "now" keeps it in today's session: tagging a card is not learning it.
  const patch = a.action === "remark" ? { [a.field]: a.value } : { note: a.note || null };
  await prisma.cardState.upsert({
    where: key,
    create: { userId, wordId: a.wordId, dueAt: new Date(), ...patch },
    update: patch,
  });
  return NextResponse.json({ ok: true });
}
