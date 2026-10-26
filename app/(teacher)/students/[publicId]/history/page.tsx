// Owns the teacher's and admin's view of one student's History: their
// recordings and audits (Practice) and the cards they answered (Study).
//
// Identified by the anonymized ID only, like the dossier: the query selects
// neither name, email nor phone. A teacher reaches it only for a student they
// have claimed, been assigned or audited (canViewHistory); anyone else gets the
// same 404 as a student who does not exist, so the page cannot be used to probe
// for IDs. An admin can open any, and each opening is written to the admin log.
//
// Recording links are left out: the review screen is for working a submission,
// and opening a finished one from here could be mistaken for claiming it.

import Link from "next/link";
import { notFound } from "next/navigation";

import { PracticeList } from "@/components/history/PracticeList";
import { StudyList } from "@/components/history/StudyList";
import { Card, CardTitle } from "@/components/ui/Card";
import { ensureActiveUser } from "@/lib/activeUser";
import { logAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { canViewHistory, practiceHistory, studyHistory, type Viewer } from "@/lib/history";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const TABS = [
  { value: "practice", label: "Practice" },
  { value: "study", label: "Study" },
] as const;

export default async function StudentHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ tab?: string; cursor?: string }>;
}) {
  // Re-checked here: a layout does not re-run on client-side navigation, and
  // the role in the token can be older than a demotion.
  await ensureActiveUser(["TEACHER", "ADMIN"]);
  const session = await auth();
  const viewer: Viewer = { id: session?.user?.id ?? "", role: session?.user?.role ?? "TEACHER" };
  const [{ publicId }, sp] = await Promise.all([params, searchParams]);
  const tab = sp.tab === "study" ? "study" : "practice";
  const cursor = sp.cursor || undefined;

  const student = await prisma.user.findFirst({ where: { publicId, role: "STUDENT" }, select: { id: true, publicId: true } });
  if (!student || !(await canViewHistory(viewer, student.id))) notFound();

  // Only the first page of a visit is logged: paging through "Older" is the
  // same look, and a row per click would bury the log.
  if (viewer.role === "ADMIN" && !cursor) {
    await logAdmin(viewer.id, "Viewed student history", "user", student.id, { tab });
  }

  const page = tab === "practice" ? await practiceHistory(student.id, viewer, cursor) : await studyHistory(student.id, viewer, cursor);
  const base = `/students/${student.publicId}/history?tab=${tab}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href={`/students/${student.publicId}`} className="text-xs text-ink-muted hover:text-accent">
        ← {student.publicId}
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">History</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {viewer.role === "ADMIN" ? "Opening this is recorded in the admin log." : "You can see this because you have worked with this student."}
      </p>

      <nav aria-label="History sections" className="mt-5 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/students/${student.publicId}/history?tab=${t.value}`}
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
        {page.items.length === 0 ? (
          <Card>
            <CardTitle>{cursor ? "No older entries" : tab === "practice" ? "No recordings you can see" : "No answers recorded"}</CardTitle>
            <p className="mt-2 text-sm text-ink-muted">
              {tab === "study"
                ? "Card answers are listed from the day History was added; earlier ones were not recorded."
                : "Recordings made on another teacher's deck are visible to that teacher only."}
            </p>
          </Card>
        ) : tab === "practice" ? (
          <PracticeList items={(page as Awaited<ReturnType<typeof practiceHistory>>).items} hrefBase={null} />
        ) : (
          <StudyList items={(page as Awaited<ReturnType<typeof studyHistory>>).items} />
        )}
      </div>

      {cursor || page.nextCursor ? (
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
    </main>
  );
}
