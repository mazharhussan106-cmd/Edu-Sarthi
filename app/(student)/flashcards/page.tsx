// Owns the Flashcard tab: category chips (Words, Chunk, Grammar), search,
// today's counts, the student's remark lists, and the card itself.
//
// URL decides what is shown, so back, refresh and sharing all work:
//   /flashcards                 → the next card in today's session
//   /flashcards?card=VRB-006    → that card
//   /flashcards?q=choose        → search results
//   /flashcards?list=important  → a remark list
//   /flashcards?more=1          → keep going past today's new-card limit

import Link from "next/link";
import { Search } from "lucide-react";
import type { CardKind } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  searchParams: Promise<{ kind?: string; card?: string; q?: string; list?: string; more?: string }>;
}) {
  const sp = await searchParams;
  const k = KINDS.find((x) => x.value === sp.kind) ?? KINDS[0];
  const session = await auth();
  const userId = session!.user.id;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const list = LISTS.find((l) => l.value === sp.list)?.value as ListKey | undefined;
  const base = `/flashcards?kind=${k.value}`;

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
    const id = byCode?.id ?? (await nextCardId(userId, k.kind, sp.more === "1"));
    const word = id ? await prisma.word.findUnique({ where: { id }, select: WORD_SELECT }) : null;

    if (!word) {
      body = (
        <Card className="mt-4 text-center">
          <p className="font-display text-lg font-bold text-ink">
            {counts && counts.known >= counts.total ? "You have seen every card" : "Done for today"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            No reviews are due and today’s {NEW_PER_DAY} new words are done. Coming back tomorrow is what makes them stick.
          </p>
          <Link href={`${base}&more=1`} className="mt-4 inline-flex h-10 items-center rounded-lg border border-border-strong px-4 text-sm text-ink hover:bg-hover">
            Learn more new words anyway
          </Link>
        </Card>
      );
    } else {
      const [state, exercise] = await Promise.all([
        prisma.cardState.findUnique({ where: { userId_wordId: { userId, wordId: word.id } } }),
        prisma.exercise.findFirst({ where: { module: { isSystem: true } }, select: { id: true } }),
      ]);
      body = (
        <div className="mt-4">
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
          />
        </div>
      );
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8">
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
          className="h-10 w-full rounded-full border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-mist focus:border-accent focus:outline-none"
        />
      </form>

      <nav aria-label="Card type" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {KINDS.map((x) => (
          <Link
            key={x.value}
            href={`/flashcards?kind=${x.value}`}
            aria-current={x.value === k.value ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium",
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
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span><b className="font-mono text-ink">{counts.due}</b> due</span>
            <span><b className="font-mono text-ink">{counts.newLeft}</b> new left today</span>
            <span><b className="font-mono text-ink">{counts.known}</b> / {counts.total} known</span>
          </p>
          <nav aria-label="My lists" className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {LISTS.map((l) => (
              <Link
                key={l.value}
                href={list === l.value ? base : `${base}&list=${l.value}`}
                aria-current={list === l.value ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs",
                  list === l.value ? "bg-accent/12 font-medium text-accent" : "bg-paper-dim text-ink-muted hover:text-ink",
                )}
              >
                {l.label} <span className="font-mono">{counts.lists[l.value]}</span>
              </Link>
            ))}
          </nav>
        </>
      ) : null}

      {body}
    </main>
  );
}
