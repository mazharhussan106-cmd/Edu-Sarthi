// Owns one exercise's submit page: the prompt, guidance, and the panel that
// records or uploads.
//
// It deliberately shows the student's previous attempts at this exercise. A
// resubmission is allowed at any time, and seeing that the last one is still
// PENDING is usually the answer to "should I send another".

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { SubmitPanel } from "@/components/media/SubmitPanel";
import { MAX_UPLOAD_BYTES } from "@/lib/storage";
import { STATUS_BADGE } from "@/lib/audits";
import { detailsOf } from "@/lib/wordCard";

export const revalidate = 0;

const HOW_TO: Record<string, string> = {
  AUDIO:
    "A phone in a normal room is fine. Speak at your usual pace — the audit is about being understood, not about sounding perfect.",
  VIDEO:
    "Frame yourself from the shoulders up in even light. Your face matters here: the teacher is watching how you carry the sentence, not just hearing it.",
  IMAGE:
    "Get the whole page in frame, flat and evenly lit. If your handwriting is hard to read in the photo, it will be hard to audit.",
};

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ word?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  // Arriving from a flashcard's "Record yourself": the recording is about
  // this word, and the teacher sees which one.
  const word = sp.word
    ? await prisma.word.findUnique({ where: { code: sp.word }, select: { id: true, code: true, text: true, details: true } })
    : null;
  const session = await auth();
  const studentId = session?.user?.id;

  const [exercise, previous] = await Promise.all([
    prisma.exercise.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        prompt: true,
        expects: true,
        minSeconds: true,
        maxSeconds: true,
        module: { select: { id: true, title: true, isSystem: true } },
      },
    }),
    // Scoped by studentId in the WHERE clause, not fetched and compared.
    prisma.submission.findMany({
      where: { studentId, exerciseId: id, ...(word ? { wordId: word.id } : {}) },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, createdAt: true },
    }),
  ]);

  if (!exercise) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href={word ? `/flashcards?card=${word.code}` : `/modules/${exercise.module.id}`}
        className="text-xs text-ink-muted hover:text-accent"
      >
        ← {word ? `Flashcard: ${word.text}` : exercise.module.title}
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-ink">
        {word ? `Say “${word.text}”` : exercise.title}
      </h1>
      {word ? (
        <p className="mt-1 text-sm text-ink-muted">
          {detailsOf(word.details).hindi_meaning} · {detailsOf(word.details).ipa}
        </p>
      ) : null}

      <Card className="mt-6">
        <CardTitle>What to do</CardTitle>
        <p className="mt-2 text-sm text-ink-muted">{exercise.prompt}</p>
        <p className="mt-3 text-xs text-mist">{HOW_TO[exercise.expects]}</p>
        {exercise.minSeconds && exercise.maxSeconds ? (
          <p className="mt-1 text-xs text-mist">
            Aim for {exercise.minSeconds}–{exercise.maxSeconds} seconds. Going a
            little over is fine.
          </p>
        ) : null}
      </Card>

      <div className="mt-6">
        {/* MAX_UPLOAD_BYTES crosses from a server component to a client one as
            a plain number, so lib/storage — and the service-role key it uses —
            never reaches the browser. */}
        <SubmitPanel
          exerciseId={exercise.id}
          expects={exercise.expects}
          maxSeconds={exercise.maxSeconds}
          maxBytes={MAX_UPLOAD_BYTES}
          wordId={word?.id}
        />
      </div>

      {previous.length > 0 ? (
        <Card className="mt-8">
          <CardTitle>Your earlier attempts</CardTitle>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {previous.map((s) => {
              const status = STATUS_BADGE[s.status];
              return (
                <li key={s.id}>
                  {/* Every attempt opens its own page, whatever its state:
                      the audit, the send-back reason, or "waiting". */}
                  <Link
                    href={`/feedback/${s.id}`}
                    className="flex items-center justify-between gap-3 py-2 hover:text-accent"
                  >
                    <span className="text-xs text-ink-muted">
                      {s.createdAt.toLocaleDateString("en-IN")}
                    </span>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </main>
  );
}
