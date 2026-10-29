// Owns the Flashcard tab: picks what to show — a card, search results, a
// remark list, or "done for today" — and loads it. Chunk and Grammar cards
// share the chunk card; only the Chunk tab has the type filter. Support
// cards have their own sides and the channel and level filters.
// The top bar (DeckTopBar) and the messages (DeckMessages) are drawn by
// their own components; the card by FlashcardDeck.
//
// URL decides what is shown, so back, refresh and sharing all work:
//   /flashcards?kind=chunks&type=frames → one chunk type (Chunk tab only)
//   /flashcards?kind=grammar            → the Grammar tab
//   /flashcards?kind=support&ch=voice&lv=basic → Support, one channel and level
//   /flashcards?card=VRB-006            → that card (its kind is taken from it)
//   /flashcards?q=choose                → search results
//   /flashcards?list=important          → a remark list
//   /flashcards?more=1                  → keep going past today's new-card limit
//   /flashcards?skip=A.B                → cards passed over with › this session
//   /flashcards?card=VRB-006&inlist=hard&sid=…&left=3 → that card inside a
//                                          "Study this list" session (lib/listSession)

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSkip } from "@/lib/cardSkip";
import { chunkDetailsOf, chunkGloss, chunkTypeLabel, isChunkType } from "@/lib/chunkCard";
import { packWhere, sectionDef, sectionWhere } from "@/lib/wordSections";
import { channelLabel, isSupportChannel, isSupportLevel, levelLabel, supportDetailsOf, supportGloss } from "@/lib/supportCard";
import { prefsOf } from "@/lib/preferences";
import { chunkExtras, deckCounts, nextCardId, practiceTitle, WORD_SELECT } from "@/lib/flashcards";
import { detailsOf } from "@/lib/wordCard";
import { ComingSoon, DeckDone, DeckResults } from "@/components/flashcards/DeckMessages";
import { DECK_KINDS, DECK_LISTS, DeckTopBar, type ListKey } from "@/components/flashcards/DeckTopBar";
import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";
import { ListSessionBar } from "@/components/flashcards/ListSessionBar";
import { listNextHref, parseListSession } from "@/lib/listSession";

export const revalidate = 0;

/// The second half of a search result's grey line: what tells two cards of
/// the same kind apart.
function metaFor(kind: string, w: { category: string | null; partOfSpeech: string | null; details: unknown }): string {
  if (kind === "CHUNK") return chunkTypeLabel(w.category);
  if (kind === "GRAMMAR") return chunkDetailsOf(w.details).group ?? "";
  if (kind === "SUPPORT") return [channelLabel(w.category), w.partOfSpeech, supportDetailsOf(w.details).kind].filter(Boolean).join(" · ");
  return w.partOfSpeech ?? "";
}

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; type?: string; sec?: string; pack?: string; card?: string; q?: string; list?: string; more?: string; skip?: string; ch?: string; lv?: string; inlist?: string; sid?: string; left?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  // A card link carries its own kind, so /flashcards?card=CORE-001 (from the
  // recording page, or a related-chunk link) opens on the Chunk tab.
  const byCode = sp.card
    ? await prisma.word.findFirst({ where: { code: sp.card, deckId: null }, select: { id: true, kind: true } })
    : null;
  const k = DECK_KINDS.find((x) => (byCode ? x.kind === byCode.kind : x.value === sp.kind)) ?? DECK_KINDS[0];
  // A card opened by "Study this list": answering goes back to the list, not
  // to this tab's next card, and the list's strip replaces the tab's top bar.
  const inList = byCode ? parseListSession(sp) : null;
  // Grammar cards are drawn and searched like chunks; only the Chunk tab
  // has types to filter by.
  const isChunk = k.kind === "CHUNK" || k.kind === "GRAMMAR";
  const type = k.kind === "CHUNK" && isChunkType(sp.type) ? sp.type : null;
  const channel = k.kind === "SUPPORT" && isSupportChannel(sp.ch) ? sp.ch : null;
  const level = k.kind === "SUPPORT" && isSupportLevel(sp.lv) ? sp.lv : null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
  // Each key is read on its own: a stored value this version no longer offers
  // falls back to its default without throwing away the other settings.
  const prefs = prefsOf(user?.preferences);
  const { cardColor, newPerDay } = prefs;

  const q = (sp.q ?? "").trim().slice(0, 60);
  const list = DECK_LISTS.find((l) => l.value === sp.list)?.value as ListKey | undefined;
  // A word section (and optionally one pack of it) narrows the Words session.
  // Only the Words tab has sections; on any other tab the parameter is ignored.
  const def = k.kind === "WORD" ? sectionDef(sp.sec) : null;
  const sectionFilter = def ? await sectionWhere(def.key) : null;
  // No `pack` means the whole section; only an explicit pack narrows it.
  const packNo = def && sectionFilter && sp.pack ? Math.max(1, Math.floor(Number(sp.pack)) || 1) : 0;
  const sectionExtra = sectionFilter ? (packNo ? await packWhere(sectionFilter, packNo) : sectionFilter) : undefined;
  const sectionQuery = def && sectionFilter ? `&sec=${def.key}${packNo ? `&pack=${packNo}` : ""}` : "";
  const base = `/flashcards?kind=${k.value}${type ? `&type=${type}` : ""}${channel ? `&ch=${channel}` : ""}${level ? `&lv=${level}` : ""}${sectionQuery}`;
  const withMore = sp.more === "1" ? `${base}&more=1` : base;
  const skip = parseSkip(sp.skip);
  // Support keeps its channel in `category`, like a chunk's type, and its
  // level in `partOfSpeech` as the sheet writes it ("Basic"). Word sections
  // and packs narrow the built-in words through `extra`.
  const deck = { kind: k.kind, category: type ?? channel ?? undefined, level: level ? levelLabel(level) : undefined, extra: sectionExtra };
  const counts = k.ready && !inList ? await deckCounts(userId, deck, newPerDay) : null;

  let body: React.ReactNode;
  if (!k.ready) {
    body = <ComingSoon label={k.label} />;
  } else if (q || list) {
    const found = await prisma.word.findMany({
      where: {
        kind: k.kind,
        deckId: null,
        ...(deck.category ? { category: deck.category } : {}),
        ...(deck.level ? { partOfSpeech: deck.level } : {}),
        // Inside a section (or pack), search and lists look only in it.
        ...(sectionExtra ? { AND: [sectionExtra] } : {}),
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
      gloss:
        k.kind === "SUPPORT"
          ? supportGloss(supportDetailsOf(w.details))
          : isChunk
            ? chunkGloss(chunkDetailsOf(w.details))
            : detailsOf(w.details).hindi_meaning ?? "",
      meta: `${w.cefr ?? ""} · ${metaFor(k.kind, w)}`,
    }));
    body = <DeckResults rows={rows} q={q} noun={k.noun} hrefFor={(code) => `${base}&card=${code}`} />;
  } else {
    const id = byCode?.id ?? (await nextCardId(userId, deck, sp.more === "1", skip, newPerDay));
    const word = id ? await prisma.word.findUnique({ where: { id }, select: WORD_SELECT }) : null;

    if (!word) {
      body = (
        <DeckDone
          skipCount={skip.length}
          allSeen={!!counts && counts.known >= counts.total}
          noun={k.noun}
          newPerDay={newPerDay}
          skipHref={withMore}
          moreHref={`${base}&more=1`}
        />
      );
    } else {
      const [state, exercise, extras] = await Promise.all([
        prisma.cardState.findUnique({ where: { userId_wordId: { userId, wordId: word.id } } }),
        prisma.exercise.findFirst({
          where: { module: { isSystem: true }, title: practiceTitle(word) },
          select: { id: true },
        }),
        word.kind === "CHUNK" || word.kind === "GRAMMAR" ? chunkExtras(word) : null,
      ]);
      body = (
        <div className="mt-2 flex min-h-0 flex-1 flex-col md:block">
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
            nextHref={inList ? listNextHref(inList) : withMore}
            skip={skip}
            cardColor={cardColor}
            support={word.kind === "SUPPORT"}
            autoSpeak={prefs.autoSpeak}
            chunk={
              extras
                ? {
                    grammar: word.kind === "GRAMMAR",
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
    <main
      // A column exactly one phone screen tall (minus the header and the
      // bottom bar). The HEIGHT is fixed, not a minimum: the card measures its
      // box to fit its text, and a box that grows with its content never
      // overflows, so nothing would fit or scroll. The controls end up at the
      // foot, directly above the navigation. 7.25rem is the header (3.5rem)
      // plus the bottom bar (3.5rem) plus their borders.
      className="mx-auto flex h-[calc(100dvh-7.25rem-env(safe-area-inset-bottom,0px))] max-w-2xl flex-col px-3 pb-1 pt-3 sm:px-6 sm:pt-6 md:block md:h-auto md:pb-4"
    >
      {inList ? <ListSessionBar s={inList} /> : <DeckTopBar
        k={k}
        type={type}
        channel={channel}
        level={level}
        list={list}
        base={base}
        section={def && sectionFilter ? { label: `${def.label}${packNo ? ` · Pack ${packNo}` : ""}`, key: def.key } : null}
        skipCount={skip.length}
        skipHref={withMore}
        counts={counts}
      />}
      {body}
    </main>
  );
}
