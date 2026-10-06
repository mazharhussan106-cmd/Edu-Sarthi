// Owns My Audits: every submission this student has sent, newest first, with a
// status badge and filter tabs (All, In review, Action needed, Completed).
//
// It deliberately lists all statuses, not only finished audits. The first
// thing a student wants after pressing Send is to see the new attempt sitting
// here as Pending.
//
// A sent-back attempt that has already been replaced is shown as replaced and
// kept out of Action needed — nothing is left for the student to do on it.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  AUDIT_FILTERS,
  averageScore,
  parseFilter,
  STATUS_BADGE,
  statusesFor,
} from "@/lib/audits";
import { cn } from "@/lib/utils";
import { cardNoun } from "@/lib/chunkCard";

export const revalidate = 0;

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const filter = parseFilter(params.f);
  const session = await auth();
  const studentId = session?.user?.id;

  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      status: { in: statusesFor(filter) },
      ...(filter === "action" ? { retry: { is: null } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      createdAt: true,
      exercise: { select: { title: true, prompt: true } },
      word: { select: { text: true, kind: true } },
      retry: { select: { id: true } },
      feedback: {
        select: {
          pronunciation: true,
          grammar: true,
          fluency: true,
          vocabulary: true,
          confidence: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">My Audits</h1>

      {params.sent ? (
        <p
          aria-live="polite"
          className="mt-3 rounded-lg bg-success/12 px-3 py-2 text-sm text-success"
        >
          Sent. A teacher will pick it up from the queue — it shows here as
          Pending until then.
        </p>
      ) : null}

      <nav aria-label="Filter audits" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {AUDIT_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/feedback" : `/feedback?f=${f.value}`}
            aria-current={filter === f.value ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
              filter === f.value
                ? "border-accent bg-accent text-on-accent"
                : "border-border-strong text-ink hover:bg-hover",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {submissions.length === 0 ? (
        <Card className="mt-6">
          <CardTitle>
            {filter === "all" ? "Nothing sent yet" : "Nothing here"}
          </CardTitle>
          <p className="mt-2 text-sm text-ink-muted">
            {filter === "all"
              ? "Record your first answer and a teacher will send back five scores and notes on exactly where to improve."
              : "No submissions match this filter right now."}
          </p>
          <Link
            href="/modules"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark"
          >
            Start speaking practice
          </Link>
        </Card>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {submissions.map((s) => {
            const replaced = s.status === "RETURNED" && s.retry !== null;
            const badge = replaced
              ? { text: "Replaced", variant: "neutral" as const }
              : STATUS_BADGE[s.status];
            return (
              <li key={s.id}>
                <Link href={`/feedback/${s.id}`} className="block">
                  <Card className="p-4 transition-colors hover:border-border-strong">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-sm font-bold text-ink">
                          {s.word ? `${cardNoun(s.word.kind)}: ${s.word.text}` : s.exercise.title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                          {s.exercise.prompt}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {s.createdAt.toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                        {s.feedback ? (
                          <span className="font-mono text-sm font-bold text-ink">
                            {averageScore(s.feedback).toFixed(1)}
                            <span className="text-xs font-normal text-ink-muted">/10</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
