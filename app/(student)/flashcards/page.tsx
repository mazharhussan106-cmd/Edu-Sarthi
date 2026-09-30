// Owns the Flashcard tab: picks what to show — a card, search results, a
// remark list, the chunk path chooser, or "done for today" — and loads it.
// The top bar (DeckTopBar) and the messages (DeckMessages) are drawn by
// their own components; the card by FlashcardDeck.
//
// URL decides what is shown, so back, refresh and sharing all work:
//   /flashcards?kind=chunks&type=frames → one chunk type (Chunk tab only)
//   /flashcards?card=VRB-006            → that card (its kind is taken from it)
//   /flashcards?q=choose                → search results
//   /flashcards?list=important          → a remark list
//   /flashcards?more=1                  → keep going past today's new-card limit
//   /flashcards?skip=A.B                → cards passed over with › this session

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSkip } from "@/lib/cardSkip";
import { chunkDetailsOf, chunkGloss, chunkTypeLabel, isChunkType } from "@/lib/chunkCard";
import { DEFAULT_PREFERENCES, PREFERENCE_SCHEMA } from "@/lib/preferences";
import { chunkExtras, deckCounts, nextCardId, PRACTICE_TITLE, WORD_SELECT } from "@/lib/flashcards";
import { detailsOf } from "@/lib/wordCard";
import { ChunkPathChooser } from "@/components/flashcards/ChunkPathChooser";
import { ComingSoon, DeckDone, DeckResults } from "@/components/flashcards/DeckMessages";
import { DECK_KINDS, DECK_LISTS, DeckTopBar, type ListKey } from "@/components/flashcards/DeckTopBar";
import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";

export const revalidate = 0;

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; type?: string; card?: string; q?: string; list?: string; more?: string; skip?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  // A card link carries its own kind, so /flashcards?card=CORE-001 (from the
  // recording page, or a related-chunk link) opens on the Chunk tab.
  const byCode = sp.card
    ? await prisma.word.findUnique({ where: { code: sp.card }, select: { id: true, kind: true } })
    : null;
  const k = DECK_KINDS.find((x) => (byCode ? x.kind === byCode.kind : x.value === sp.kind)) ?? DECK_KINDS[0];
  const isChunk = k.kind === "CHUNK";
  const type = isChunk && isChunkType(sp.type) ? sp.type : null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
  // Read loosely: a stored value this version no longer offers falls back to
  // its default instead of throwing away the student's other settings.
  const prefs = PREFERENCE_SCHEMA.partial().safeParse(user?.preferences ?? {});
  const cardColor = (prefs.success && prefs.data.cardColor) || DEFAULT_PREFERENCES.cardColor;
  const path = prefs.success ? prefs.data.chunkPath ?? null : null;

  const q = (sp.q ?? "").trim().slice(0, 60);
  const list = DECK_LISTS.find((l) => l.value === sp.list)?.value as ListKey | undefined;
  const base = `/flashcards?kind=${k.value}${type ? `&type=${type}` : ""}`;
  const withMore = sp.more === "1" ? `${base}&more=1` : base;
  const skip = parseSkip(sp.skip);
  const deck = { kind: k.kind, category: type ?? undefined, path: path ?? undefined };
  const counts = k.ready ? await deckCounts(userId, deck) : null;

  let body: React.ReactNode;
  if (!k.ready) {
    body = <ComingSoon label={k.label} />;
  } else if (q || list) {
    const found = await prisma.word.findMany({
      where: {
        kind: k.kind,
        ...(type ? { category: type } : {}),
        ...(q
          ? { OR: [{ text: { contains: q, mode: "insensitive" } }, { code: { equals: q.toUpperCase() } }] }
          : { states: { some: { userId, [list!]: true } } }),
      },
      orderBy: q ? { text: "asc" } : { serial: "asc" },
      take: 50,
      select: { code: true, text: true, cefr: true, partOfSpeech: true, category: true, details: true },
    });
    const rows = found.map((w) => ({
      code: w.code,
      text: w.text,
      gloss: isChunk ? chunkGloss(chunkDetailsOf(w.details)) : detailsOf(w.details).hindi_meaning ?? "",
      meta: `${w.cefr ?? ""} · ${isChunk ? chunkTypeLabel(w.category) : w.partOfSpeech ?? ""}`,
    }));
    body = <DeckResults rows={rows} q={q} noun={k.noun} hrefFor={(code) => `${base}&card=${code}`} />;
  } else if (isChunk && !path && !byCode) {
    body = <ChunkPathChooser />;
  } else {
    const id = byCode?.id ?? (await nextCardId(userId, deck, sp.more === "1", skip));
    const word = id ? await prisma.word.findUnique({ where: { id }, select: WORD_SELECT }) : null;

    if (!word) {
      body = (
        <DeckDone
          skipCount={skip.length}
          allSeen={!!counts && counts.known >= counts.total}
          noun={k.noun}
          skipHref={withMore}
          moreHref={`${base}&more=1`}
        />
      );
    } else {
      const [state, exercise, extras] = await Promise.all([
        prisma.cardState.findUnique({ where: { userId_wordId: { userId, wordId: word.id } } }),
        prisma.exercise.findFirst({
          where: { module: { isSystem: true }, title: PRACTICE_TITLE[word.kind] },
          select: { id: true },
        }),
        word.kind === "CHUNK" ? chunkExtras(word) : null,
      ]);
      body = (
        <div className="mt-2">
          <FlashcardDeck
            key={word.id}
            word={word}
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
            recordHref={exercise ? `/practice/${exercise.id}?word=${word.code}` : null}
            nextHref={withMore}
            skip={skip}
            cardColor={cardColor}
            tallTop={isChunk}
            chunk={
              extras
                ? {
                    path: path ?? "A",
                    distractors: extras.distractors,
                    related: extras.related,
                    relatedHref: extras.related ? `/flashcards?card=${extras.related.code}` : null,
                  }
                : undefined
            }
          />
        </div>
      );
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-3 pb-4 pt-3 sm:px-6 sm:pt-6">
      <DeckTopBar
        k={k}
        type={type}
        q={q}
        list={list}
        base={base}
        skipCount={skip.length}
        skipHref={withMore}
        counts={counts}
      />
      {body}
    </main>
  );
}
