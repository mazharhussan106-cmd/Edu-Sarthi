// Owns step two of the AI card maker: takes the person's request, the questions
// and their answers, and returns draft cards grouped into chapters.
//
// It saves NO cards. The drafts go back to the browser so the person can read,
// edit and choose before anything enters a deck. What it does save is the
// allowance used, the tokens spent and the answers to remember.
//
// The cards are taken from the free allowance before the model runs and the
// unused ones given back after (lib/aiCardLimits), so a failure costs nothing
// and parallel requests cannot overshoot the total.

import { NextResponse } from "next/server";

import { MAX_CARDS_PER_REQUEST, makeCards, rememberAnswers, type Answer } from "@/lib/aiCards";
import { loadRemembered, saveRemembered } from "@/lib/aiCardPrefs";
import { reserveCards, settleCards } from "@/lib/aiCardLimits";
import { makeSchema } from "@/lib/aiCardSchemas";
import { deleteSources, resolveSources } from "@/lib/aiSources";
import { AiError } from "@/lib/aiTranscribe";
import { requireUser } from "@/lib/apiUser";
import { readJson } from "@/lib/decks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Ten cards take a minute or two to write. Vercel lowers this on plans that
// allow less; the questions route has its own, shorter limit.
export const maxDuration = 300;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;

  const parsed = makeSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check your answers and try again.", 400);
  const { request, sources: given, questions, answers } = parsed.data;

  const countText = answers.count?.[0] ?? "";
  if (!/^\d{1,3}$/.test(countText) || Number(countText) < 1) return fail("Say how many cards you want, then try again.", 400);
  const wanted = Math.min(Number(countText), MAX_CARDS_PER_REQUEST);

  // Files are read before any card is reserved, so a missing or damaged file
  // costs the person nothing.
  let files;
  try {
    files = await resolveSources(gate.id, given);
  } catch (err) {
    if (err instanceof AiError) return fail(err.message, 422);
    throw err;
  }
  const sources = files.sources;

  const reserved = await reserveCards(gate.id, gate.role, wanted);
  if (!reserved.ok) return fail(reserved.error, 429);

  const told: Answer[] = questions.flatMap((q) => {
    const a = answers[q.id];
    return a?.length ? [{ question: q.text, answer: a.join(", ") }] : [];
  });

  let made;
  try {
    made = await makeCards({ request, sources, answers: told, count: reserved.granted });
  } catch (err) {
    // Nothing was made, so nothing is charged.
    await settleCards(gate.id, gate.role, reserved.granted, 0, 0).catch(() => undefined);
    if (err instanceof AiError) return fail(err.message, 422);
    console.error("ai-cards make failed:", err instanceof Error ? err.name : "unknown");
    return fail("Something went wrong making the cards. Nothing was used from your allowance. Try again.", 500);
  }

  // The cards are already made, so a bookkeeping failure must not hide them.
  // The files are deleted now that they have been used; on a failure above they
  // stay, so the person can try again without uploading them twice.
  await deleteSources(gate.id, files.fileIds).catch(() => undefined);
  await settleCards(gate.id, gate.role, reserved.granted, made.cardCount, made.tokens).catch(() => undefined);
  await loadRemembered(gate.id)
    .then((prev) => saveRemembered(gate.id, rememberAnswers(questions, answers, prev)))
    .catch(() => undefined);

  return NextResponse.json({
    ok: true,
    chapters: made.chapters,
    cardCount: made.cardCount,
    dropped: made.dropped,
    note: made.note,
    // Fewer than asked because the allowance is nearly used up.
    clamped: reserved.granted < wanted,
    remaining: reserved.remaining === null ? null : reserved.remaining + (reserved.granted - made.cardCount),
  });
}
