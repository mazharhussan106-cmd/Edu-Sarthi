// Owns "Today's review": everything waiting for the student today on one
// page — cards due and new cards left for each kind of built-in card, decks
// with cards due, and recordings to redo or still waiting for an audit.
//
// It deliberately only links. Studying happens on the Flashcard tab and the
// deck study pages, which pick the next card themselves; this page never
// serves a card, so it can never disagree with them about which one is next.

import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";
import { todayReview } from "@/lib/todayReview";
import { Card, CardTitle } from "@/components/ui/Card";
import { DECK_KINDS } from "@/components/flashcards/DeckTopBar";

export const revalidate = 0;

const row = "flex min-h-12 items-center justify-between gap-3 py-2.5 hover:bg-hover";

export default async function TodayPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  // Teachers and admins have no cards of their own to review.
  if (session?.user?.role === "TEACHER") redirect("/queue");
  if (session?.user?.role === "ADMIN") redirect("/admin");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
  const [{ kinds, decks }, redo, waiting] = await Promise.all([
    todayReview(userId, prefsOf(user?.preferences).newPerDay),
    // A sent-back recording already re-recorded has nothing left to do.
    prisma.submission.count({ where: { studentId: userId, status: "RETURNED", retry: { is: null } } }),
    prisma.submission.count({ where: { studentId: userId, status: { in: ["PENDING", "IN_REVIEW"] } } }),
  ]);

  const totalDue = [...kinds.values()].reduce((n, k) => n + k.due, 0) + decks.reduce((n, d) => n + d.due, 0);
  const totalNew = [...kinds.values()].reduce((n, k) => n + k.newLeft, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Today&apos;s review</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {totalDue > 0
          ? `${totalDue} card${totalDue === 1 ? " is" : "s are"} due today. Reviewing on time is what makes them stick.`
          : totalNew > 0
            ? "No cards are due right now. New cards are still waiting below if you want to learn more."
            : "Nothing is due and today's new cards are done. Come back tomorrow."}
      </p>

      <Card className="mt-6">
        <CardTitle>EduSarthi cards</CardTitle>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {DECK_KINDS.map((k) => {
            const today = kinds.get(k.kind) ?? { due: 0, newLeft: 0 };
            return (
              <li key={k.value}>
                <Link href={`/flashcards?kind=${k.value}`} className={row}>
                  <span className="text-sm font-medium text-ink">{k.label}</span>
                  <span className="text-xs text-ink-muted">
                    <b className="font-mono text-ink">{today.due}</b> due · <b className="font-mono text-ink">{today.newLeft}</b> new left
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-ink-muted">
          New cards per day are counted for each kind separately. Change the number in <Link href="/settings" className="font-medium text-accent hover:underline">Settings</Link>.
        </p>
      </Card>

      <Card className="mt-4">
        <CardTitle>Your decks</CardTitle>
        {decks.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            No deck cards are due. Your own decks, shared decks and decks you follow are in <Link href="/decks" className="font-medium text-accent hover:underline">My decks</Link>.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {decks.map((d) => (
              <li key={d.id}>
                <Link href={d.href} className={row}>
                  <span className="min-w-0 truncate text-sm font-medium text-ink">{d.title}</span>
                  <span className="shrink-0 text-xs text-ink-muted"><b className="font-mono text-ink">{d.due}</b> due</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4">
        <CardTitle>Recordings</CardTitle>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          <li>
            <Link href="/feedback?f=action" className={row}>
              <span className="text-sm font-medium text-ink">To re-record</span>
              <span className="font-mono text-sm text-ink">{redo}</span>
            </Link>
          </li>
          <li>
            <Link href="/feedback?f=review" className={row}>
              <span className="text-sm font-medium text-ink">Waiting for audit</span>
              <span className="font-mono text-sm text-ink">{waiting}</span>
            </Link>
          </li>
        </ul>
      </Card>
    </main>
  );
}
