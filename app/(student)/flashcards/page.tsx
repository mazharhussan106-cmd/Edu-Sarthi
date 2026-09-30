// Owns the Flashcard tab: category chips (Words, Chunk, Grammar), search,
// today's counts, the student's remark lists, and the card itself.
//
// URL decides what is shown, so back, refresh and sharing all work:
//   /flashcards                 → the next card in today's session
//   /flashcards?card=VRB-006    → that card
//   /flashcards?q=choose        → search results
//   /flashcards?list=important  → a remark list
//   /flashcards?more=1          → keep going past today's new-card limit
//   /flashcards?skip=A.B        → cards passed over with › this session
//
// The top is kept to two short rows (search, then type chips with the lists
// and counts) so the card itself gets most of a phone screen.

import Link from "next/link";
import { Search } from "lucide-react";
import type { CardKind } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSkip } from "@/lib/cardSkip";
import { DEFAULT_PREFERENCES, PREFERENCE_SCHEMA } from "@/lib/preferences";
import { deckCounts, nextCardId, WORD_SELECT } from "@/lib/flashcards";
import { detailsOf } from "@/lib/wordCard";
import { NEW_PER_DAY } from "@/lib/srs";
import { Card } from "@/components/ui/Card";
import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const KINDS = [
  { value: "words", label: "Words", kind: "WORD" as CardKind, ready: true },
  { value: "chunks", label: "Chunk", kind: "CHUNK" as CardKind, ready: false },
  { value: "grammar", label: "Grammar", kind: "GRAMMAR" as CardKind, ready: false },
];

const LISTS = [
  { value: "important", label: "⭐ Important" },
  { value: "favourite", label: "❤️ Favourite" },
  { value: "doubt", label: "❓ Doubt" },
  { value: "confident", label: "💯 Confident" },
] as const;
type ListKey = (typeof LISTS)[number]["value"];

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; card?: string; q?: string; list?: string; more?: string; skip?: string }>;
}) {
  const sp = await searchParams;
  const k = KINDS.find((x) => x.value === sp.kind) ?? KINDS[0];
  const session = await auth();
  const userId = session!.user.id;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const list = LISTS.find((l) => l.value === sp.list)?.value as ListKey | undefined;
  const base = `/flashcards?kind=${k.value}`;
  const skip = parseSkip(sp.skip);

  const counts = k.ready ? await deckCounts(userId, k.kind) : null;

  let body: React.ReactNode;
  if (!k.ready) {
    body = (
      <Card className="mt-4 text-center">
        <p className="font-display text-lg font-bold text-ink">{k.label} cards are coming</p>
        <p className="mt-1 text-sm text-ink-muted">The content is being prepared. Words are ready to practise now.</p>
        <Link href="/flashcards?kind=words" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Practise words
        </Link>
      </Card>
    );
  } else if (q || list) {
    const results = await prisma.word.findMany({
      where: {
        kind: k.kind,
        ...(q
          ? { OR: [{ text: { contains: q, mode: "insensitive" } }, { code: { equals: q.toUpperCase() } }] }
          : { states: { some: { userId, [list!]: true } } }),
      },
      orderBy: q ? { text: "asc" } : { serial: "asc" },
      take: 50,
      select: { code: true, text: true, cefr: true, partOfSpeech: true, details: true },
    });
    body = (
      <div className="mt-4">
        <p className="text-sm text-ink-muted">
          {results.length === 0
            ? q
              ? `No word matches “${q}”.`
              : "Nothing in this list yet. Use Remark on a card to add it here."
            : `${results.length} word${results.length === 1 ? "" : "s"}`}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {results.map((w) => (
            <li key={w.code}>
              <Link href={`${base}&card=${w.code}`} className="block">
                <Card className="flex items-center justify-between gap-3 p-3 hover:bg-hover">
                  <span className="min-w-0">
                    <span className="block font-display font-bold text-ink">{w.text}</span>
                    <span className="block truncate text-xs text-ink-muted">{detailsOf(w.details).hindi_meaning}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-mist">
                    {w.cefr} · {w.partOfSpeech}
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  } else {
    const byCode = sp.card
      ? await prisma.word.findUnique({ where: { code: sp.card }, select: { id: true, kind: true } })
      : null;
    const id = byCode?.id ?? (await nextCardId(userId, k.kind, sp.more === "1", skip));
    const word = id ? await prisma.word.findUnique({ where: { id }, select: WORD_SELECT }) : null;

    if (!word) {
      body = (
        <Card className="mt-4 text-center">
          <p className="font-display text-lg font-bold text-ink">
            {skip.length ? "No more cards except the ones you skipped" : counts && counts.known >= counts.total ? "You have seen every card" : "Done for today"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {skip.length
              ? `You skipped ${skip.length} card${skip.length === 1 ? "" : "s"} with ›. Go through them now, or come back later.`
              : `No reviews are due and today’s ${NEW_PER_DAY} new words are done. Coming back tomorrow is what makes them stick.`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {skip.length ? (
              <Link href={sp.more === "1" ? `${base}&more=1` : base} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
                Show skipped cards again
              </Link>
            ) : null}
            <Link href={`${base}&more=1`} className="inline-flex h-10 items-center rounded-lg border border-border-strong px-4 text-sm text-ink hover:bg-hover">
              Learn more new words anyway
            </Link>
          </div>
        </Card>
      );
    } else {
      const [state, exercise, user] = await Promise.all([
        prisma.cardState.findUnique({ where: { userId_wordId: { userId, wordId: word.id } } }),
        prisma.exercise.findFirst({ where: { module: { isSystem: true } }, select: { id: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } }),
      ]);
      // Read loosely: a stored colour this version no longer offers falls back
      // to plain instead of throwing away the student's other settings.
      const prefs = PREFERENCE_SCHEMA.pick({ cardColor: true }).safeParse(user?.preferences ?? {});
      const cardColor = prefs.success ? prefs.data.cardColor : DEFAULT_PREFERENCES.cardColor;
      body = (
        <div className="mt-2">
          <FlashcardDeck
            key={word.id}
            word={{ ...word, details: detailsOf(word.details) }}
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
            nextHref={sp.more === "1" ? `${base}&more=1` : base}
            skip={skip}
            initialColor={cardColor}
          />
        </div>
      );
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-3 pb-4 pt-3 sm:px-6 sm:pt-6">
      <form action="/flashcards" className="relative">
        <input type="hidden" name="kind" value={k.value} />
        <label htmlFor="card-search" className="sr-only">Search words</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" aria-hidden="true" />
        <input
          id="card-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search a word or ID"
          className="h-9 w-full rounded-full border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-mist focus:border-accent focus:outline-none"
        />
      </form>

      {/* One scrolling row: card types, then the student's lists, then
          today's counts. Three rows here would push the card below the fold. */}
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {/* First in the row so it is on screen without scrolling: the
            student has to be able to find the cards they skipped. */}
        {skip.length ? (
          <Link
            href={sp.more === "1" ? `${base}&more=1` : base}
            className="shrink-0 rounded-full border border-saffron px-2 py-1 text-xs font-medium text-ink hover:bg-hover"
          >
            ⏭ {skip.length} skipped · show again
          </Link>
        ) : null}
        <nav aria-label="Card type" className="flex shrink-0 gap-1.5">
          {KINDS.map((x) => (
            <Link
              key={x.value}
              href={`/flashcards?kind=${x.value}`}
              aria-current={x.value === k.value ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[13px] font-medium",
                x.value === k.value ? "border-accent bg-accent text-on-accent" : "border-border-strong text-ink hover:bg-hover",
              )}
            >
              {x.label}
              {!x.ready ? <span className="ml-1 text-[10px] opacity-70">soon</span> : null}
            </Link>
          ))}
        </nav>
        {counts ? (
          <>
            <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-border-strong" />
            <nav aria-label="My lists" className="flex shrink-0 gap-1">
              {LISTS.map((l) => (
                <Link
                  key={l.value}
                  href={list === l.value ? base : `${base}&list=${l.value}`}
                  aria-current={list === l.value ? "page" : undefined}
                  aria-label={`${l.label} list, ${counts.lists[l.value]} words`}
                  className={cn(
                    "shrink-0 rounded-full px-2 py-1 text-xs",
                    list === l.value ? "bg-accent/12 font-medium text-accent" : "bg-paper-dim text-ink-muted hover:text-ink",
                  )}
                >
                  {l.label.split(" ")[0]} <span className="font-mono">{counts.lists[l.value]}</span>
                </Link>
              ))}
            </nav>
            <p className="ml-1 shrink-0 text-xs text-ink-muted">
              <b className="font-mono text-ink">{counts.due}</b> due · <b className="font-mono text-ink">{counts.newLeft}</b> new ·{" "}
              <b className="font-mono text-ink">{counts.known}</b>/{counts.total} known
            </p>
          </>
        ) : null}
      </div>

      {body}
    </main>
  );
}
