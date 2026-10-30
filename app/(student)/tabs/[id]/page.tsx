// Owns a study tab the student made: the study tabs on top (this one
// current), the tab's name, and its decks as rows — size, cards due today,
// Study (the deck's own study page) and Remove from this tab — with "＋ Add
// decks" to choose which of their decks it shows.
//
// Only the student's own tab opens; any other id is a 404, never a peek at
// someone else's (lib/studyTabs scopes every read by the student). Studying
// happens on the deck's existing study page, so progress and the review plan
// are the same wherever a deck is opened from.

import Link from "next/link";
import { notFound } from "next/navigation";

import { AreaTabs } from "@/components/flashcards/AreaTabs";
import { RemoveFromTab } from "@/components/tabs/RemoveFromTab";
import { TabDeckPicker } from "@/components/tabs/TabDeckPicker";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { auth } from "@/lib/auth";
import { tabbableDecks, tabPage } from "@/lib/studyTabs";

export const revalidate = 0;

export default async function StudyTabPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const userId = session!.user.id;
  // Not a cuid: not one of ours, and not worth a database read.
  if (!/^[a-z0-9]{10,40}$/.test(id)) notFound();
  const [page, all] = await Promise.all([tabPage(userId, id), tabbableDecks(userId)]);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-6 sm:pt-6">
      <AreaTabs current={page.tab.id} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate font-display text-xl font-bold text-ink">{page.tab.name}</h1>
        <TabDeckPicker tabId={page.tab.id} tabName={page.tab.name} decks={all} selected={page.decks.map((d) => d.id)} />
      </div>

      {page.decks.length ? (
        <ul aria-label={`Decks in ${page.tab.name}`} className="mt-4 flex flex-col gap-2">
          {page.decks.map((d) => (
            <li key={d.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <Link href={d.href} className="min-w-0 flex-1 rounded-lg hover:underline">
                  <span className="block truncate font-display font-bold text-ink">{d.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs text-ink-muted">{d.cards} cards</span>
                    {d.available && d.due ? <Badge variant="accent">{d.due} due</Badge> : null}
                    {d.available ? null : <Badge>not available now</Badge>}
                  </span>
                </Link>
                <span className="flex shrink-0 items-center gap-1">
                  <Link href={d.href} aria-label={`Study ${d.title}`} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-on-accent hover:bg-accent-dark">
                    Study
                  </Link>
                  <RemoveFromTab tabId={page.tab.id} deckId={d.id} title={d.title} />
                </span>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="mt-4 text-center text-sm text-ink-muted">
          No decks in this tab yet. Tap ＋ Add decks to choose from your own, followed and shared decks.
        </Card>
      )}
    </main>
  );
}
