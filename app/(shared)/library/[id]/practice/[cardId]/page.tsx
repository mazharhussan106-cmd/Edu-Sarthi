// Owns "record yourself" for one card of a verified teacher's library deck:
// the card, and the same recorder the speaking exercises use. The recording is
// routed to that deck's teacher alone (see /api/submissions), who audits it
// with the usual rubric.
//
// Students only, and only for decks whose owner is a verified teacher — the
// check is practiceWord, the same rule the API enforces. It deliberately does
// NOT show the audit result; that lives in Audited like every other.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, faceCard, practiceWord } from "@/lib/decks";
import { MAX_UPLOAD_BYTES } from "@/lib/storage";
import { Card, CardTitle } from "@/components/ui/Card";
import { CardFront } from "@/components/decks/CardFace";
import { SubmitPanel } from "@/components/media/SubmitPanel";

export const revalidate = 0;

export default async function PracticeCardPage({ params }: { params: Promise<{ id: string; cardId: string }> }) {
  const [{ id, cardId }, session] = await Promise.all([params, auth()]);
  // Staff review recordings; they do not send them.
  if (session?.user?.role !== "STUDENT") redirect(`/library/${id}`);

  const target = await practiceWord({ id: cardId, deckId: id });
  if (!target || !target.teacherId) notFound();

  const [card, exercise] = await Promise.all([
    prisma.word.findUnique({ where: { id: cardId }, select: CARD_SELECT }),
    prisma.exercise.findFirst({ where: { module: { isSystem: true }, expects: "AUDIO" }, select: { id: true, maxSeconds: true } }),
  ]);
  if (!card) notFound();

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <Link href={`/library/${id}`} className="text-sm font-medium text-accent hover:underline">← Back to the deck</Link>
      <h1 className="mt-2 font-display text-xl font-bold text-ink">Say it and send it to the teacher</h1>
      <Card className="mt-4">
        <CardFront card={await faceCard(card)} />
      </Card>
      <Card className="mt-4">
        <CardTitle>How this works</CardTitle>
        <p className="mt-2 text-sm text-ink-muted">
          Record yourself saying or answering the card. The deck’s teacher listens and sends back scores and notes in <b>Audited</b>.
          Only that teacher sees this recording, with your student ID rather than your name.
        </p>
      </Card>
      <div className="mt-4">
        {exercise ? (
          <SubmitPanel exerciseId={exercise.id} expects="AUDIO" maxSeconds={exercise.maxSeconds} maxBytes={MAX_UPLOAD_BYTES} wordId={cardId} />
        ) : (
          <Card className="text-sm text-ink-muted">Recording is not set up yet. Ask an admin to add the speaking practice exercise, then try again.</Card>
        )}
      </div>
    </main>
  );
}
