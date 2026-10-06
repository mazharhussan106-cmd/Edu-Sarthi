// Owns the Learn (Seekho) hub: search, level filter, and the speaking modules
// with this student's progress on each. Flashcards and Chunks & Frames have
// placeholder cards until their format is settled.
//
// It deliberately does not lock later modules behind earlier ones. A student
// who wants to attempt level 3 first is allowed to; the audit will tell them
// if it was too early, which is more useful than a padlock.
//
// Search and the level filter live in the URL (?q=, ?level=), so they work
// with no client JavaScript and survive the back button.

import Link from "next/link";
import { Search } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const COMING = [
  { title: "Flashcards", body: "Daily words with meaning, examples and audio." },
  { title: "Chunks & Sentence Frames", body: "Ready-made phrases and Hindi-to-English sentence patterns." },
];

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 80);
  const level = Number(params.level) || null;

  const session = await auth();
  const studentId = session?.user?.id;

  const [modules, levels, submissions] = await Promise.all([
    prisma.module.findMany({
      where: {
        isSystem: false,
        ...(level ? { level } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { exercises: { some: { title: { contains: q, mode: "insensitive" } } } },
              ],
            }
          : {}),
      },
      orderBy: [{ level: "asc" }, { title: "asc" }],
      select: {
        id: true,
        level: true,
        title: true,
        description: true,
        exercises: { select: { id: true } },
      },
    }),
    prisma.module.findMany({ where: { isSystem: false }, distinct: ["level"], orderBy: { level: "asc" }, select: { level: true } }),
    // Every exercise this student has submitted against, in one query. The
    // alternative is a count per module, which is a query per card.
    prisma.submission.findMany({
      where: { studentId },
      select: { exerciseId: true },
      distinct: ["exerciseId"],
    }),
  ]);

  const attempted = new Set(submissions.map((s) => s.exerciseId));
  const href = (next: { q?: string; level?: number | null }) => {
    const sp = new URLSearchParams();
    const nq = next.q ?? q;
    const nl = next.level === undefined ? level : next.level;
    if (nq) sp.set("q", nq);
    if (nl) sp.set("level", String(nl));
    const str = sp.toString();
    return str ? `/modules?${str}` : "/modules";
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Learn</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Start anywhere. Every speaking exercise is audited by a teacher.
      </p>

      <form action="/modules" className="relative mt-5">
        <label htmlFor="learn-search" className="sr-only">
          Search lessons
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" aria-hidden="true" />
        <input
          id="learn-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search lessons"
          className="h-11 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
        />
        {level ? <input type="hidden" name="level" value={level} /> : null}
      </form>

      <nav aria-label="Filter by level" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {[{ level: null as number | null, label: "All levels" }, ...levels.map((l) => ({ level: l.level, label: `Level ${l.level}` }))].map((chip) => (
          <Link
            key={chip.label}
            href={href({ level: chip.level })}
            aria-current={level === chip.level ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
              level === chip.level
                ? "border-accent bg-accent text-on-accent"
                : "border-border-strong text-ink hover:bg-hover",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </nav>

      <h2 className="mt-6 font-display text-lg font-bold text-ink">Speaking practice</h2>
      {modules.length === 0 ? (
        <Card className="mt-3">
          <p className="text-sm text-ink-muted">
            {q || level ? "Nothing matches that search." : "No modules yet. Check back shortly."}
          </p>
          {q || level ? (
            <Link href="/modules" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
              Clear search and filter
            </Link>
          ) : null}
        </Card>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {modules.map((m) => {
            const done = m.exercises.filter((e) => attempted.has(e.id)).length;
            const total = m.exercises.length;
            const state =
              total > 0 && done === total
                ? { text: "Completed", variant: "success" as const }
                : done > 0
                  ? { text: `In progress · ${done}/${total}`, variant: "accent" as const }
                  : { text: `${total} exercise${total === 1 ? "" : "s"}`, variant: "neutral" as const };

            return (
              <Link key={m.id} href={`/modules/${m.id}`} className="block">
                <Card className="h-full p-4 transition-colors hover:bg-hover sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-md bg-paper-dim px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                      Level {m.level}
                    </span>
                    <Badge variant={state.variant}>{state.text}</Badge>
                  </div>
                  <CardTitle className="mt-2">{m.title}</CardTitle>
                  <p className="mt-1 text-sm text-ink-muted">{m.description}</p>
                  {total > 0 ? (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-dim" aria-hidden="true">
                      <div className="h-full rounded-full bg-success" style={{ width: `${(done / total) * 100}%` }} />
                    </div>
                  ) : null}
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <h2 className="mt-8 font-display text-lg font-bold text-ink">Coming soon</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {COMING.map((c) => (
          <Card key={c.title} className="border-dashed p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{c.title}</CardTitle>
              <Badge>Soon</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{c.body}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
