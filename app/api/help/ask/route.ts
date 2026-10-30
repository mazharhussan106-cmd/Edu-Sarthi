// Owns one question to the help chatbot: check it is switched on and who is
// asking, take one of today's questions (20 for an account, 5 for a guest),
// ask the model, and give the question back if the model could not answer.
//
// It deliberately stores neither the question nor the answer: only the count
// row, with the tokens the answer used. The model sees no account data
// (lib/aiHelp), so nothing here is scoped beyond "this person's count".

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { askHelp } from "@/lib/aiHelp";
import { recordHelpTokens, refundHelp, reserveHelp } from "@/lib/aiHelpLimits";
import { helpAskSchema } from "@/lib/aiHelpSchemas";
import { helpBotEnabled } from "@/lib/aiEnabled";
import { AiError } from "@/lib/aiTranscribe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  // Before anything is counted, so taps while the key is missing cost nothing.
  if (!helpBotEnabled()) {
    return NextResponse.json({ error: "The AI help is not switched on yet. The questions below and the Support page can still help." }, { status: 503 });
  }
  const gate = await requireUser();
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Refresh the page and ask again." }, { status: 400 });
  }
  const parsed = helpAskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Type your question first." }, { status: 400 });
  }

  const me = await prisma.user.findUnique({ where: { id: gate.id }, select: { isGuest: true } });
  const seat = await reserveHelp(gate.id, Boolean(me?.isGuest));
  if (!seat.ok) return NextResponse.json({ error: seat.error, left: 0 }, { status: 429 });

  try {
    const out = await askHelp(parsed.data);
    await recordHelpTokens(seat.id, out.tokens);
    return NextResponse.json({ answer: out.answer, left: seat.left });
  } catch (err) {
    // Not answered, so not counted.
    await refundHelp(seat.id);
    if (err instanceof AiError) return NextResponse.json({ error: err.message, left: seat.left + 1 }, { status: 502 });
    throw err;
  }
}
