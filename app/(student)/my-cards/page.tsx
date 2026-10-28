// Owns "My cards": the student's marked cards from every kind of card and
// every deck they can still open, one list at a time — Saved (⭐ ❤️), Marked
// Unknown, Doubt, My notes, Confident. Each card opens where it is studied.
//
// The Flashcard tab has the same remark lists, but only for the tab that is
// open and only for built-in cards; this is the one place that shows them all.
//
// Paged by a fixed cap (LIST_SIZE), not by cursor: a list longer than that is
// rare, and the page says how many are not shown rather than hiding it.

import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { cardNoun } from "@/lib/chunkCard";
import { CARD_LISTS, LIST_SIZE, cardList, parseList } from "@/lib/myCards";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export const revalidate = 0;

export default async function MyCardsPage({ searchParams }: { searchParams: Promise<{ list?: string }> }) {
  const list = parseList((await searchParams).list);
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  // Teachers and admins do not study cards, so there is nothing to list.
  if (session?.user?.role === "TEACHER") redirect("/queue");
  if (session?.user?.role === "ADMIN") redirect("/admin");

  const { cards, counts } = await cardList(userId, list);
  const current = CARD_LISTS.find((l) => l.value === list)!;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">My cards</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Cards you marked, from words, chunks, grammar, support and your decks. Tap a card to open it.
      </p>

      <nav aria-label="Card lists" className="mt-5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {CARD_LISTS.map((l) => (
          <Link
            key={l.value}
            href={`/my-cards?list=${l.value}`}
            aria-current={l.value === list ? "page" : undefined}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-1 rounded-full border px-3 text-[13px] font-medium",
              l.value === list ? "border-accent bg-accent text-on-accent" : "border-border-strong text-ink hover:bg-hover",
            )}
          >
            {l.label} <span className="font-mono">{counts[l.value]}</span>
          </Link>
        ))}
      </nav>

      {cards.length === 0 ? (
        <Card className="mt-4 text-sm text-ink-muted">
          {current.empty}{" "}
          <Link href="/flashcards" className="font-medium text-accent hover:underline">Open flashcards</Link>
        </Card>
      ) : (
        <Card className="mt-4 p-0">
          <ul className="divide-y divide-border">
            {cards.map((c) => (
              <li key={c.id}>
                <Link href={c.href} className="flex min-h-12 flex-col justify-center px-4 py-2.5 hover:bg-hover">
                  <span className="text-sm font-medium text-ink">{c.text}</span>
                  <span className="truncate text-xs text-ink-muted">{c.deck ? `Deck · ${c.deck}` : cardNoun(c.kind)}</span>
                  {c.note ? <span className="mt-0.5 line-clamp-2 text-xs text-ink">📝 {c.note}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {counts[list] > LIST_SIZE ? (
        <p className="mt-2 text-xs text-ink-muted">
          Showing the {LIST_SIZE} most recently answered of {counts[list]}. Unmark cards you are done with to see the rest.
        </p>
      ) : null}
    </main>
  );
}
