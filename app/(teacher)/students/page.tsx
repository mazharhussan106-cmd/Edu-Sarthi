// Owns the teacher's roster: every student who has submitted, with how much is
// outstanding and where they stand.
//
// It deliberately lists students by submission activity rather than every
// registered account. A teacher's job is the queue, and a roster full of people
// who signed up and never sent anything buries the ones who did.
//
// It deliberately does NOT paginate yet. At a few hundred students one query is
// fine; past that this needs a cursor, and guessing at the shape now would be
// building for traffic that does not exist.

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";

export const revalidate = 0;

const CRITERIA = [
  "pronunciation",
  "grammar",
  "fluency",
  "vocabulary",
  "confidence",
] as const;

export default async function StudentsPage() {
  // One query with the submissions nested, rather than a roster query plus a
  // count per student. The nested rows are small — no media, no summaries.
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", submissions: { some: {} } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
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
      },
    },
  });

  const rows = students
    .map((s) => {
      const audited = s.submissions.filter((x) => x.feedback !== null);

      const mean =
        audited.length > 0
          ? audited.reduce((sum, x) => {
              const f = x.feedback!;
              return sum + CRITERIA.reduce((t, k) => t + f[k], 0) / 5;
            }, 0) / audited.length
          : null;

      return {
        id: s.id,
        name: s.name ?? "Unnamed student",
        email: s.email ?? "",
        total: s.submissions.length,
        audited: audited.length,
        waiting: s.submissions.filter(
          (x) => x.status === "PENDING" || x.status === "IN_REVIEW",
        ).length,
        lastAt: s.submissions[0]?.createdAt ?? null,
        mean,
      };
    })
    // Students with something outstanding first — that is what a teacher opens
    // this page to find. Ties break on who has waited longest.
    .sort((a, b) => {
      if (a.waiting !== b.waiting) return b.waiting - a.waiting;
      return (a.lastAt?.getTime() ?? 0) - (b.lastAt?.getTime() ?? 0);
    });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Students</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {rows.length === 0
          ? "Nobody has submitted anything yet."
          : `${rows.length} student${rows.length === 1 ? "" : "s"} who have sent work.`}
      </p>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-ink-muted">
            Students appear here once they send their first recording.
          </p>
          <Link
            href="/queue"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Back to the queue
          </Link>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle>{r.name}</CardTitle>
                <p className="mt-0.5 truncate text-xs text-ink-muted">{r.email}</p>
              </div>

              <div className="flex shrink-0 items-center gap-6">
                <div className="text-right">
                  <p className="font-mono text-sm text-ink">
                    {r.audited}/{r.total}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-ink-muted">
                    audited
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-mono text-sm text-ink">
                    {r.mean !== null ? r.mean.toFixed(1) : "—"}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-ink-muted">
                    average
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-ink-muted">
                    {r.lastAt ? r.lastAt.toLocaleDateString("en-IN") : "—"}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-ink-muted">
                    last sent
                  </p>
                </div>

                {r.waiting > 0 ? (
                  <Badge variant="accent">{r.waiting} waiting</Badge>
                ) : (
                  <Badge variant="success">Clear</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
