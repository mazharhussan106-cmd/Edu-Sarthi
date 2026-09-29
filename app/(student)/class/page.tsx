// Owns the Class tab. Live classes and recorded video lessons are planned for
// here; until they exist, this page says so plainly and leads to the speaking
// exercises, which are audited by a teacher today.
//
// It deliberately shows no fake schedule or sample class. An invented
// timetable is a promise nobody has made yet.

import Link from "next/link";
import { Mic, Video } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/Card";

export const revalidate = 0;

export default async function ClassPage() {
  const modules = await prisma.module.findMany({
    where: { isSystem: false },
    orderBy: [{ level: "asc" }, { title: "asc" }],
    select: { id: true, title: true, level: true, _count: { select: { exercises: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Class</h1>

      <Card className="mt-4 flex items-start gap-3 border-dashed">
        <Video className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <CardTitle>Live classes and video lessons</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            Coming soon. Your teacher’s live sessions and recorded lessons will appear here.
          </p>
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-2">
        <Mic className="h-5 w-5 text-accent" aria-hidden="true" />
        <h2 className="font-display text-lg font-bold text-ink">Speaking practice</h2>
      </div>
      <p className="mt-1 text-sm text-ink-muted">Record an answer and a teacher sends back a scored audit.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {modules.map((m) => (
          <li key={m.id}>
            <Link href={`/modules/${m.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 hover:bg-hover">
                <span>
                  <span className="block font-display font-bold text-ink">{m.title}</span>
                  <span className="text-xs text-ink-muted">
                    Level {m.level} · {m._count.exercises} exercise{m._count.exercises === 1 ? "" : "s"}
                  </span>
                </span>
                <span aria-hidden="true" className="text-mist">›</span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/modules" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
        Search all exercises
      </Link>
    </main>
  );
}
