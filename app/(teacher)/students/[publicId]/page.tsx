// Owns one student's dossier for teachers (spec T-04): first audit against
// latest, the five-criterion trend over a chosen range, recurring issues, and
// the history of every attempt.
//
// Identified by the anonymized ID only. The query never selects name, email
// or phone, so no later change to this page's JSX can leak them.
//
// "Recurring issues" is derived, not typed by anyone: the criteria that stay
// lowest across audits, and the most recent notes teachers marked Major.

import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { averageScore, STATUS_BADGE } from "@/lib/audits";
import { noteSchema } from "@/lib/validations";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { MetricTrend, type MetricPoint } from "@/components/review/MetricTrend";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const RANGES = [
  { value: "1m", label: "1 month", days: 30 },
  { value: "3m", label: "3 months", days: 90 },
  { value: "all", label: "All time", days: null },
] as const;

const CRITERIA = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "grammar", label: "Grammar" },
  { key: "fluency", label: "Fluency" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "confidence", label: "Confidence" },
] as const;

export default async function DossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const [{ publicId }, sp] = await Promise.all([params, searchParams]);
  const range = RANGES.find((r) => r.value === sp.range) ?? RANGES[2];
  const since = range.days ? new Date(Date.now() - range.days * 86_400_000) : undefined;

  const student = await prisma.user.findFirst({
    where: { publicId, role: "STUDENT" },
    select: {
      publicId: true,
      // Words the student marked "Doubt — ask teacher" on a flashcard.
      cardStates: {
        where: { doubt: true },
        orderBy: { lastReviewedAt: "desc" },
        take: 20,
        select: { note: true, word: { select: { text: true, code: true } } },
      },
      createdAt: true,
      submissions: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          exercise: { select: { title: true, module: { select: { level: true } } } },
          feedback: {
            select: {
              pronunciation: true,
              grammar: true,
              fluency: true,
              vocabulary: true,
              confidence: true,
              notes: true,
            },
          },
        },
      },
    },
  });
  if (!student) notFound();

  const audited = student.submissions.filter((s) => s.feedback !== null);
  const inRange = audited.filter((s) => !since || s.createdAt >= since);
  const first = audited[0]?.feedback ?? null;
  const latest = audited[audited.length - 1]?.feedback ?? null;

  const points: MetricPoint[] = inRange.map((s) => ({
    label: s.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    pronunciation: s.feedback!.pronunciation,
    grammar: s.feedback!.grammar,
    fluency: s.feedback!.fluency,
    vocabulary: s.feedback!.vocabulary,
    confidence: s.feedback!.confidence,
  }));

  const means = CRITERIA.map((c) => ({
    label: c.label,
    mean: audited.length ? audited.reduce((t, s) => t + s.feedback![c.key], 0) / audited.length : 0,
  })).sort((a, b) => a.mean - b.mean);

  const majorNotes = audited
    .flatMap((s) => {
      const parsed = z.array(noteSchema).safeParse(s.feedback!.notes);
      return (parsed.success ? parsed.data : [])
        .filter((n) => n.severity === "major")
        .map((n) => ({ note: n.note, at: s.createdAt, title: s.exercise.title }));
    })
    .reverse()
    .slice(0, 6);

  const waiting = student.submissions.filter((s) => s.status === "PENDING" || s.status === "IN_REVIEW").length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/students" className="text-xs text-ink-muted hover:text-accent">
        ← Students
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold text-ink">{student.publicId}</h1>
        <Badge>{student.submissions.length} sent</Badge>
        <Badge variant="success">{audited.length} audited</Badge>
        {waiting ? <Badge variant="accent">{waiting} waiting</Badge> : null}
      </div>
      <p className="mt-1 text-sm text-ink-muted">Joined {student.createdAt.toLocaleDateString("en-IN")}</p>

      {audited.length === 0 ? (
        <Card className="mt-6">
          <CardTitle>Initial student submission</CardTitle>
          <p className="mt-2 text-sm text-ink-muted">No historical trend data yet — this student has no audits.</p>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wider text-ink-muted">First audit</p>
              <p className="mt-1 font-mono text-3xl font-bold text-ink">{averageScore(first!).toFixed(1)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wider text-ink-muted">Latest audit</p>
              <p className="mt-1 font-mono text-3xl font-bold text-ink">{averageScore(latest!).toFixed(1)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wider text-ink-muted">Change</p>
              {/* One audit is its own first and latest; "+0.0" in green
                  would read as "no progress" when there is nothing to compare. */}
              {audited.length < 2 ? (
                <p className="mt-1 font-mono text-3xl font-bold text-mist">—</p>
              ) : (
                <p
                  className={cn(
                    "mt-1 font-mono text-3xl font-bold",
                    averageScore(latest!) >= averageScore(first!) ? "text-success" : "text-error",
                  )}
                >
                  {averageScore(latest!) - averageScore(first!) >= 0 ? "+" : ""}
                  {(averageScore(latest!) - averageScore(first!)).toFixed(1)}
                </p>
              )}
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Scores over time</CardTitle>
                <nav aria-label="Range" className="flex gap-1">
                  {RANGES.map((r) => (
                    <Link
                      key={r.value}
                      href={`/students/${student.publicId}?range=${r.value}`}
                      aria-current={r.value === range.value ? "page" : undefined}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        r.value === range.value
                          ? "border-accent bg-accent text-on-accent"
                          : "border-border-strong text-ink hover:bg-hover",
                      )}
                    >
                      {r.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="mt-4">
                <MetricTrend data={points} />
              </div>
            </Card>

            <Card className="border-l-4 border-l-error/60">
              <CardTitle>Recurring issues</CardTitle>
              <p className="mt-2 text-sm text-ink-muted">
                Lowest on average: <span className="text-ink">{means[0].label}</span> ({means[0].mean.toFixed(1)})
                and <span className="text-ink">{means[1].label}</span> ({means[1].mean.toFixed(1)}).
              </p>
              {majorNotes.length > 0 ? (
                <>
                  <p className="mt-4 text-xs uppercase tracking-wider text-ink-muted">Recent major notes</p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {majorNotes.map((n, i) => (
                      <li key={i} className="text-sm text-ink">
                        {n.note}
                        <span className="block text-xs text-mist">
                          {n.title} · {n.at.toLocaleDateString("en-IN")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-3 text-xs text-mist">No notes marked Major yet.</p>
              )}
            </Card>
          </div>
        </>
      )}

      {student.cardStates.length > 0 ? (
        <Card className="mt-4">
          <CardTitle>Flashcard doubts</CardTitle>
          <p className="mt-1 text-xs text-ink-muted">Words this student asked a teacher to explain.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {student.cardStates.map((c) => (
              <li key={c.word.code} className="rounded-lg bg-paper-dim px-2.5 py-1.5 text-sm text-ink" title={c.note ?? undefined}>
                {c.word.text}
                {c.note ? <span className="block max-w-56 truncate text-xs text-ink-muted">“{c.note}”</span> : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardTitle>History</CardTitle>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-ink-muted">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Exercise</th>
              <th className="py-2 font-medium">Level</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 text-right font-medium">Average</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...student.submissions].reverse().map((s) => (
              <tr key={s.id}>
                <td className="py-2 text-ink-muted">{s.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="py-2 text-ink">{s.exercise.title}</td>
                <td className="py-2 text-ink-muted">L{s.exercise.module.level}</td>
                <td className="py-2">
                  <Badge variant={STATUS_BADGE[s.status].variant}>{STATUS_BADGE[s.status].text}</Badge>
                </td>
                <td className="py-2 text-right font-mono text-ink">
                  {s.feedback ? averageScore(s.feedback).toFixed(1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
