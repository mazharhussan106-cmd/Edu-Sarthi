// Owns a study session on one of the student's own decks: the next card by the
// review ladder (due first, then new), or a card named in the URL (‹ back),
// shown on the same EduSarthi card as the built-in words.
//
// The card is chosen here, on the server, so a refresh never skips or repeats
// one. Which card may be opened is decided by the query — only this deck and
// only the signed-in owner's — never by trusting the URL. It deliberately does
// NOT save answers; DeckStudy posts them to /api/flashcards, the endpoint the
// built-in cards use.

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSkip } from "@/lib/cardSkip";
import { CARD_SELECT, deckStudyCounts, faceCard, nextDeckCardId } from "@/lib/decks";
import { DEFAULT_PREFERENCES, PREFERENCE_SCHEMA } from "@/lib/preferences";
import { Card } from "@/components/ui/Card";
import { DeckStudy } from "@/components/decks/DeckStudy";

export const revalidate = 0;

export default async function StudyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ card?: string; skip?: string }> }) {
  const [{ id }, sp, session] = await Promise.all([params, searchParams, auth()]);
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({ where: { id, ownerId: userId }, select: { title: true } });
  if (!deck) notFound();

  const skip = parseSkip(sp.skip);
  const [counts, picked] = await Promise.all([
    deckStudyCounts(userId, id),
    sp.card ? prisma.word.findFirst({ where: { code: sp.card, deckId: id, ownerId: userId }, select: { id: true } }) : null,
  ]);
  const wordId = picked?.id ?? (await nextDeckCardId(userId, id, skip));
  const word = wordId ? await prisma.word.findFirst({ where: { id: wordId, deckId: id, ownerId: userId }, select: CARD_SELECT }) : null;

  const [state, user] = word
    ? await Promise.all([
        prisma.cardState.findUnique({ where: { userId_wordId: { userId, wordId: word.id } } }),
        prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } }),
      ])
    : [null, null];
  // Read loosely: a stored colour this version no longer offers falls back to
  // plain instead of throwing away the student's other settings.
  const prefs = PREFERENCE_SCHEMA.pick({ cardColor: true }).safeParse(user?.preferences ?? {});
  const cardColor = prefs.success ? prefs.data.cardColor : DEFAULT_PREFERENCES.cardColor;

  return (
    <main className="mx-auto max-w-2xl px-3 pb-4 pt-3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/decks/${id}`} className="min-w-0 truncate text-sm font-medium text-accent hover:underline">← {deck.title}</Link>
        <p className="shrink-0 text-xs text-ink-muted">
          <b className="font-mono text-ink">{counts.due}</b> due · <b className="font-mono text-ink">{counts.fresh}</b> new
        </p>
      </div>
      <div className="mt-2">
        {word ? (
          <DeckStudy
            key={word.id}
            wordId={word.id}
            card={await faceCard(word)}
            state={{
              confident: state?.confident ?? false,
              important: state?.important ?? false,
              favourite: state?.favourite ?? false,
              doubt: state?.doubt ?? false,
              note: state?.note ?? null,
              recall: state?.recall ?? null,
              stage: state && state.reviews > 0 ? state.stage : null,
              dueAt: state && state.reviews > 0 ? state.dueAt.toISOString() : null,
            }}
            nextHref={`/decks/${id}/study?deck=1`}
            skip={skip}
            cardColor={cardColor}
          />
        ) : (
          <Card className="text-center">
            <p className="font-display text-lg font-bold text-ink">{counts.total === 0 ? "This deck has no cards yet" : skip.length ? "No more cards except the ones you skipped" : "Done for now"}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {counts.total === 0 ? "Add a few cards, then come back to study." : skip.length ? `You skipped ${skip.length} with ›. Go through them now, or come back later.` : "No cards are due. Coming back later is what makes them stick."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {skip.length ? <Link href={`/decks/${id}/study`} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">Show skipped cards again</Link> : null}
              <Link href={`/decks/${id}`} className="inline-flex h-10 items-center rounded-lg border border-border-strong px-4 text-sm text-ink hover:bg-hover">Back to the deck</Link>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
