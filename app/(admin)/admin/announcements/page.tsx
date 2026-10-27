// Owns the admin Announcements page: the one that is sending (with progress and
// Stop), drafts (test, start, delete), finished ones, and the form for a new
// draft — pre-filled with the owner-approved Terms update when there is none.
//
// An announcement emails every account holder with a verified address, at most
// 80 a day from the daily job, and starting it posts the dashboard notice. It
// deliberately shows counts only, never a list of who was emailed.

import { prisma } from "@/lib/prisma";
import { ensureActiveUser } from "@/lib/activeUser";
import { appUrl } from "@/lib/appUrl";
import { ANNOUNCEMENT_DAILY_LIMIT, announcementStats, termsUpdateDraft } from "@/lib/announcements";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { ActionButton } from "@/components/admin/ActionButton";
import { AnnouncementForm, TestButton } from "@/components/admin/AnnouncementForm";

export const revalidate = 0;

const API = "/api/admin/announcements";

export default async function AnnouncementsPage() {
  await ensureActiveUser(["ADMIN"]);
  const rows = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, subject: true, body: true, notice: true, createdAt: true, startedAt: true, finishedAt: true },
  });
  const withStats = await Promise.all(rows.map(async (a) => ({ ...a, stats: await announcementStats(a) })));
  // In production a missing NEXT_PUBLIC_APP_URL throws rather than guess; the
  // draft then says so instead of carrying links that would not work.
  let site = "";
  try {
    site = appUrl();
  } catch {
    site = "";
  }
  const draft = termsUpdateDraft(site || "(set NEXT_PUBLIC_APP_URL in Vercel)");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Announcements</h1>
      <p className="mt-1 text-sm text-ink-muted">
        An email to every account holder with a verified email address, for changes the Terms and Privacy pages promise to email about.
        The daily job (about 7 pm IST) sends at most {ANNOUNCEMENT_DAILY_LIMIT} a day. Starting one also posts its notice on students’ dashboards for 30 days.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {withStats.map((a) => {
          const sending = Boolean(a.startedAt && !a.finishedAt);
          const days = Math.ceil(a.stats.left / ANNOUNCEMENT_DAILY_LIMIT);
          return (
            <li key={a.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle>{a.subject}</CardTitle>
                  {!a.startedAt ? <Badge>Draft</Badge> : sending ? <Badge variant="accent">Sending</Badge> : <Badge variant="success">Finished</Badge>}
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {a.startedAt
                    ? `Started ${a.startedAt.toLocaleDateString("en-IN")} · sent ${a.stats.sent} of ${a.stats.total} · failed ${a.stats.failed}${sending ? ` · about ${days} day${days === 1 ? "" : "s"} to go` : ""}`
                    : `Written ${a.createdAt.toLocaleDateString("en-IN")} · would go to ${a.stats.total} account holders, about ${days} day${days === 1 ? "" : "s"} at ${ANNOUNCEMENT_DAILY_LIMIT} a day`}
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-accent">Read the email and the notice</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-paper-dim p-3 font-sans text-sm text-ink">{a.body}</pre>
                  <p className="mt-2 text-sm text-ink"><b>Dashboard notice:</b> {a.notice}</p>
                </details>
                <div className="mt-3 flex flex-wrap items-start justify-end gap-2">
                  <TestButton id={a.id} />
                  {!a.startedAt ? (
                    <>
                      <ActionButton url={API} body={{ action: "delete", id: a.id }} label="Delete draft" variant="ghost" />
                      <ActionButton url={API} body={{ action: "start", id: a.id }} label={`Start sending to ${a.stats.total}`} variant="primary" confirmWord="SEND" />
                    </>
                  ) : null}
                  {sending ? <ActionButton url={API} body={{ action: "stop", id: a.id }} label="Stop sending" confirmWord="STOP" /> : null}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card className="mt-6">
        <CardTitle>New draft</CardTitle>
        <p className="mt-1 text-xs text-ink-muted">Nothing is sent until you press Start on the draft and type SEND. Email yourself a test first.</p>
        <div className="mt-4"><AnnouncementForm initial={rows.length ? { subject: "", body: "", notice: "" } : draft} /></div>
      </Card>
    </main>
  );
}
