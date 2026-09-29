// Owns the pending-submission queue: oldest first, so nobody waits twice as
// long as everyone else.
//
// It deliberately shows the teacher's own IN_REVIEW items in a separate list
// above the queue. A claimed submission that vanishes from every screen is one
// nobody finishes.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";

export const revalidate = 0;

function waitingFor(since: Date): string {
  const hours = Math.floor((Date.now() - since.getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function QueuePage() {
  const session = await auth();
  const teacherId = session?.user?.id;

  const [mine, pending] = await Promise.all([
    prisma.submission.findMany({
      where: { claimedById: teacherId, status: "IN_REVIEW" },
      orderBy: { claimedAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        mediaKind: true,
        durationSec: true,
        student: { select: { name: true } },
        exercise: { select: { title: true } },
      },
    }),
    prisma.submission.findMany({
      where: { status: "PENDING" },
      // Oldest first. Newest-first quietly starves the back of the queue.
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        mediaKind: true,
        durationSec: true,
        student: { select: { name: true } },
        exercise: { select: { title: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Review queue</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {pending.length === 0
          ? "Nothing waiting."
          : `${pending.length} waiting, oldest first.`}
      </p>

      {mine.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-ink">
            Open with you
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {mine.map((s) => (
              <Card key={s.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle>{s.exercise.title}</CardTitle>
                  <p className="mt-1 text-xs text-ink-muted">
                    {s.student.name ?? "Unnamed student"} · submitted{" "}
                    {waitingFor(s.createdAt)}
                  </p>
                </div>
                <Link href={`/review/${s.id}`}>
                  <Button size="sm">Continue</Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink">Waiting</h2>

        {pending.length === 0 ? (
          <Card className="mt-4">
            <p className="text-sm text-ink-muted">
              No submissions are waiting. New ones appear here as students send
              them.
            </p>
          </Card>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {pending.map((s) => (
              <Card key={s.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle>{s.exercise.title}</CardTitle>
                  <p className="mt-1 text-xs text-ink-muted">
                    {s.student.name ?? "Unnamed student"} ·{" "}
                    {waitingFor(s.createdAt)}
                    {s.durationSec ? ` · ${s.durationSec}s` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge>{s.mediaKind.toLowerCase()}</Badge>
                  <Link href={`/review/${s.id}`}>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
