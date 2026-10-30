// Owns the notification inbox: notices for every student at the top, then this
// person's own notifications, newest first, 20 a page. Students, teachers and
// admins all have one; only students see notices (they are written for them).
//
// It deliberately never changes read state while it renders: Next can render a
// page before anyone opens it, so the marks come from the browser
// (components/notifications/*). Paged with plain links (?cursor=), like History, so it works on a
// slow phone. Rows come from the session's own account, never the URL.

import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/Card";
import { MarkAllRead, NoticesSeen } from "@/components/notifications/InboxControls";
import { NotificationList } from "@/components/notifications/NotificationList";
import { formatEvent } from "@/lib/notices";
import { inboxNotices, inboxPage, unreadCount } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const revalidate = 0;
export const metadata = { title: "Notifications — EduSarthi" };

const when = (d: Date) =>
  d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });

const heading = "text-xs font-semibold uppercase tracking-wider text-ink-muted";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  if (!userId || !role) redirect("/login");
  const cursor = typeof sp.cursor === "string" && sp.cursor ? sp.cursor : undefined;

  // Notices only on the first page: they are few, and repeating them on every
  // page of older items would push those items down for nothing.
  const [notices, page, unread] = await Promise.all([
    cursor ? Promise.resolve([]) : inboxNotices(userId, role),
    inboxPage(userId, cursor),
    unreadCount(userId, role),
  ]);
  const unseen = notices.filter((n) => n.unread).map((n) => n.id);
  // Notices on screen now are being marked seen (NoticesSeen), so the heading
  // counts only what is still waiting — the same number the bell is about to show.
  const waiting = Math.max(0, unread - unseen.length);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-ink-muted">{waiting === 0 ? "You are all caught up." : `${waiting} unread`}</p>
        </div>
        {waiting > 0 ? <MarkAllRead /> : null}
      </div>

      {notices.length > 0 ? (
        <section aria-labelledby="notices-heading" className="mt-6">
          <h2 id="notices-heading" className={heading}>
            Notices for everyone
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {notices.map((n) => (
              <li key={n.id}>
                <Card className={cn("p-4", n.unread && "border-accent/40")}>
                  <div className="flex items-start gap-2.5">
                    <span aria-hidden="true" className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.unread ? "bg-accent" : "bg-transparent")} />
                    <div className="min-w-0">
                      <p className={cn("text-sm text-ink", n.unread ? "font-semibold" : "font-medium")}>
                        {n.unread ? <span className="sr-only">New: </span> : null}
                        {n.title}
                      </p>
                      {n.eventAt ? <p className="text-xs font-semibold text-accent">{formatEvent(n.eventAt)}</p> : null}
                      <p className="mt-0.5 whitespace-pre-line break-words text-sm text-ink-muted">{n.body}</p>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <NoticesSeen ids={unseen} />
        </section>
      ) : null}

      <section aria-labelledby="mine-heading" className="mt-6">
        <h2 id="mine-heading" className={heading}>
          For you
        </h2>
        <div className="mt-2">
          {page.items.length === 0 ? (
            <Card>
              <CardTitle>{cursor ? "No older notifications" : "Nothing here yet"}</CardTitle>
              <p className="mt-2 text-sm text-ink-muted">
                {cursor
                  ? "You have reached the end. Notifications are kept for up to six months."
                  : role === "STUDENT"
                    ? "When a teacher audits or sends back your recording, or an admin reviews your deck, it shows here."
                    : "Recordings sent to your decks and decisions about your decks show here."}
              </p>
            </Card>
          ) : (
            <NotificationList
              items={page.items.map((i) => ({ id: i.id, title: i.title, body: i.body, link: i.link, when: when(i.createdAt), unread: i.unread }))}
            />
          )}
        </div>
      </section>

      {cursor || page.nextCursor ? (
        <nav aria-label="More notifications" className="mt-5 flex items-center justify-between text-sm">
          {cursor ? (
            <Link href="/notifications" className="text-accent hover:underline">
              ‹ Newest
            </Link>
          ) : (
            <span />
          )}
          {page.nextCursor ? (
            <Link href={`/notifications?cursor=${page.nextCursor}`} className="text-accent hover:underline">
              Older ›
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
