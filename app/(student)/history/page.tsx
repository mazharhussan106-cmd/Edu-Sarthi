// Owns the student's History page: Practice (recordings and their audits) and
// Study (every card answered, by day), with a few numbers on top.
//
// Paged with plain links (?cursor=), not client state, so it works on a slow
// phone without loading a list library. It shows only the signed-in student's
// own rows — the id comes from the session, never the URL. Teacher and admin
// views of the same data live in their own pages.
//
// A guest cannot record, so their Practice tab explains how to get an account;
// their Study tab works like anyone's.

import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/Card";
import { DeleteStudyHistory } from "@/components/history/DeleteStudyHistory";
import { PracticeList } from "@/components/history/PracticeList";
import { StudyList } from "@/components/history/StudyList";
import { practiceHistory, studyDays, studyHistory } from "@/lib/history";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const TABS = [
  { value: "practice", label: "Practice" },
  { value: "study", label: "Study" },
] as const;

const istDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ tab?: string; cursor?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "study" ? "study" : "practice";
  const session = await auth();
  const userId = session?.user?.id ?? "";
  // Teachers and admins have no history of their own; theirs is the student's,
  // opened from the dossier. Without this they would see an empty page.
  if (session?.user?.role === "TEACHER") redirect("/queue");
  if (session?.user?.role === "ADMIN") redirect("/admin");
  const isGuest = !!session?.user?.isGuest;
  const viewer = { id: userId, role: "STUDENT" as const };
  const cursor = sp.cursor || undefined;

  const [days, practice, study] = await Promise.all([
    studyDays(userId, 30),
    tab === "practice" && !isGuest ? practiceHistory(userId, viewer, cursor) : null,
    tab === "study" ? studyHistory(userId, viewer, cursor) : null,
  ]);

  const today = istDay(new Date());
  const weekAgo = istDay(new Date(Date.now() - 6 * 86_400_000));
  const answeredToday = days.find((d) => d.day === today)?.answers ?? 0;
  const answeredWeek = days.filter((d) => d.day >= weekAgo).reduce((n, d) => n + d.answers, 0);

  const page = practice ?? study;
  const base = `/history?tab=${tab}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">History</h1>
      <p className="mt-1 text-sm text-ink-muted">Your recordings and the cards you have answered.</p>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {[
          { n: answeredToday, l: "answers today" },
          { n: answeredWeek, l: "answers, 7 days" },
          { n: days.length, l: days.length === 1 ? "day studied, 30 days" : "days studied, 30 days" },
        ].map((s) => (
          <Card key={s.l} className="p-3">
            <p className="font-mono text-2xl font-bold text-ink">{s.n}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">{s.l}</p>
          </Card>
        ))}
      </div>

      <nav aria-label="History sections" className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/history?tab=${t.value}`}
            aria-current={tab === t.value ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium",
              tab === t.value ? "border-accent bg-accent text-on-accent" : "border-border-strong text-ink hover:bg-hover",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5">
        {tab === "practice" && isGuest ? (
          <Card>
            <CardTitle>Recordings need a free account</CardTitle>
            <p className="mt-2 text-sm text-ink-muted">Guests can study the flashcards but cannot send recordings. Create a free account to record, get audits and see them here.</p>
            <Link href="/register" className="mt-4 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
              Create a free account
            </Link>
          </Card>
        ) : practice && practice.items.length === 0 ? (
          <Card>
            <CardTitle>No recordings yet</CardTitle>
            <p className="mt-2 text-sm text-ink-muted">Record an answer from a practice module or a card. It will show here with its audit.</p>
            <Link href="/modules" className="mt-4 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
              Start speaking practice
            </Link>
          </Card>
        ) : practice ? (
          <PracticeList items={practice.items} hrefBase="/feedback" />
        ) : study && study.items.length === 0 ? (
          <Card>
            <CardTitle>{cursor ? "No older answers" : "No answers recorded yet"}</CardTitle>
            <p className="mt-2 text-sm text-ink-muted">
              {cursor
                ? "You have reached the start of your history."
                : "Answer a flashcard and it will be listed here. Answers from before this page existed were not recorded."}
            </p>
          </Card>
        ) : study ? (
          <StudyList items={study.items} />
        ) : null}
      </div>

      {page && (cursor || page.nextCursor) ? (
        <div className="mt-5 flex items-center justify-between text-sm">
          {cursor ? (
            <Link href={base} className="text-accent hover:underline">
              ‹ Newest
            </Link>
          ) : (
            <span />
          )}
          {page.nextCursor ? (
            <Link href={`${base}&cursor=${page.nextCursor}`} className="text-accent hover:underline">
              Older ›
            </Link>
          ) : null}
        </div>
      ) : null}

      {tab === "study" ? (
        <div className="mt-10 border-t border-border pt-6">
          <DeleteStudyHistory />
        </div>
      ) : null}
    </main>
  );
}
