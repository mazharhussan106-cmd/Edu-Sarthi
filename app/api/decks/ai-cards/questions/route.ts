// Owns step one of the AI card maker: given what the person wants (and any
// pasted text), it returns the few questions the AI wants answered first, each
// with the person's last answer already offered as the default.
//
// It makes no cards and saves nothing but the tokens spent. It deliberately
// does not decide the card count or run the model for cards; that is
// /api/decks/ai-cards/make, so a person can answer, change their mind and ask
// again without a card being used.

import { NextResponse } from "next/server";

import { askQuestions } from "@/lib/aiCards";
import { loadRemembered } from "@/lib/aiCardPrefs";
import { mayAsk, remainingCards, settleCards } from "@/lib/aiCardLimits";
import { requestSchema } from "@/lib/aiCardSchemas";
import { AiError } from "@/lib/aiTranscribe";
import { requireUser } from "@/lib/apiUser";
import { readJson } from "@/lib/decks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  // Guests are study-only accounts; the AI costs money, so it needs a real one.
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;

  const parsed = requestSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check what you typed and try again.", 400);

  const blocked = await mayAsk(gate.id, gate.role);
  if (blocked) return fail(blocked, 429);

  try {
    const remembered = await loadRemembered(gate.id);
    const asked = await askQuestions({ ...parsed.data, remembered });
    // Counted even though no card is made: the call was paid for.
    await settleCards(gate.id, gate.role, 0, 0, asked.tokens).catch(() => undefined);
    return NextResponse.json({
      ok: true,
      kind: asked.kind,
      questions: asked.questions,
      remaining: await remainingCards(gate.id, gate.role),
    });
  } catch (err) {
    if (err instanceof AiError) return fail(err.message, 422);
    // Not logged with the error object: it can carry the request text.
    console.error("ai-cards questions failed:", err instanceof Error ? err.name : "unknown");
    return fail("Something went wrong. Try again in a minute.", 500);
  }
}
