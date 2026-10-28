// Owns "Study this list": it picks the next card of one of the student's lists
// (⭐ Important … 🟢 Easy) and sends them to that card on its own study page,
// with the session in the URL (lib/listSession). Known, Unknown, › and ‹ on
// that card come back here, so the session walks the list one card at a time,
// built-in and deck cards alike, on the one EduSarthi card.
//
// It shows a page of its own only when there is nothing to open: the list is
// empty, or every card in it has been through the session.
//
// Answering here is ordinary answering — the same /api/flashcards, so a card's
// review date moves as it would anywhere else. That is deliberate: a student
// who marks a card Known has told us they know it.

import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { CARD_LISTS, listStep } from "@/lib/myCards";
import { parseSkip } from "@/lib/cardSkip";
import { STATE_ID } from "@/lib/listSession";
import { Card } from "@/components/ui/Card";

export const revalidate = 0;

const button = "inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium";

export default async function ListStudyPage({ searchParams }: { searchParams: Promise<{ list?: string; after?: string; card?: string }> }) {
  const sp = await searchParams;
  const current = CARD_LISTS.find((l) => l.value === sp.list);
  if (!current) redirect("/my-cards");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  // Teachers and admins do not study cards, so there is nothing to list.
  if (session?.user?.role === "TEACHER") redirect("/queue");
  if (session?.user?.role === "ADMIN") redirect("/admin");

  // Both checked for shape before they reach a query; anything else is ignored.
  const after = sp.after && STATE_ID.test(sp.after) ? sp.after : undefined;
  const card = parseSkip(sp.card)[0];
  const step = await listStep(userId, current.value, { after, card });
  if ("href" in step) redirect(step.href);

  const empty = step.total === 0;
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Card className="text-center">
        <p className="text-3xl" aria-hidden="true">{current.icon}</p>
        <h1 className="mt-2 font-display text-lg font-bold text-ink">
          {empty ? `${current.label} is empty` : `You went through every card in ${current.label}`}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {empty ? current.empty : `${step.total} card${step.total === 1 ? " is" : "s are"} in this list now. Go through them again, or come back after you study more.`}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {empty ? (
            <Link href="/flashcards" className={`${button} bg-accent text-on-accent hover:bg-accent-dark`}>Open flashcards</Link>
          ) : (
            <Link href={`/my-cards/study?list=${current.value}`} className={`${button} bg-accent text-on-accent hover:bg-accent-dark`}>Study it again</Link>
          )}
          <Link href={`/my-cards?list=${current.value}`} className={`${button} border border-border-strong text-ink hover:bg-hover`}>Back to the list</Link>
        </div>
      </Card>
    </main>
  );
}
