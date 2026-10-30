// Owns the bell in the header: the unread count and the link to the inbox.
//
// The layout renders it with a count read on the server, so the number is
// right on first paint. Layouts do not re-render on navigation, so after that
// it asks /api/notifications itself: when the page changes (at most once in 30
// seconds, so quick taps through the app do not each cost a request on mobile
// data) and when the person comes back to the tab. The inbox page tells it the
// new count at once through a window event (components/notifications/inboxClient).
//
// It deliberately does NOT poll on a timer. A request every few seconds on
// every page costs slow phones for news that can wait for the next tap.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { INBOX_EVENT, type InboxEventDetail } from "@/components/notifications/inboxClient";

const REFRESH_AFTER_MS = 30_000;

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const pathname = usePathname();
  // Starts at "just fetched": the server's count is fresh on first paint.
  const fetchedAt = useRef(Date.now());

  const refresh = useCallback(async () => {
    if (Date.now() - fetchedAt.current < REFRESH_AFTER_MS) return;
    fetchedAt.current = Date.now();
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data: unknown = JSON.parse(await res.text());
      const n = data && typeof data === "object" ? (data as { unread?: unknown }).unread : undefined;
      if (typeof n === "number") setUnread(n);
    } catch {
      // Offline, or an HTML error page: keep the last number rather than blank the bell.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    function onInbox(e: Event) {
      const d = (e as CustomEvent<InboxEventDetail | undefined>).detail;
      if (!d) return;
      if ("unread" in d) {
        setUnread(d.unread);
        fetchedAt.current = Date.now();
      } else {
        setUnread((n) => Math.max(0, n + d.delta));
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(INBOX_EVENT, onInbox);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(INBOX_EVENT, onInbox);
    };
  }, [refresh]);

  return (
    <Link
      href="/notifications"
      // Not prefetched: the bell is on every page, and fetching the inbox ahead
      // of every visit spends mobile data on a page most visits never open.
      prefetch={false}
      aria-label={unread === 0 ? "Notifications" : `Notifications, ${unread} unread`}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-hover"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unread > 0 ? (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold leading-none text-on-accent"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
