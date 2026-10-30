// Owns the person's own notifications on the inbox page: unread ones marked
// with a dot and bold title, and a tap that marks one read on its way to the
// page it points at.
//
// The read mark is not awaited: opening the audit is never held up by it on a
// slow connection. The bell drops by one at once and takes the server's exact
// count when the mark lands. It deliberately fetches nothing; the page passes
// rows it already read for this person, with the time already written out.

"use client";

import Link from "next/link";
import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { announce, sendInboxAction } from "@/components/notifications/inboxClient";
import { cn } from "@/lib/utils";

export type ListItem = { id: string; title: string; body: string; link: string; when: string; unread: boolean };

export function NotificationList({ items }: { items: readonly ListItem[] }) {
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());

  function open(item: ListItem) {
    if (!item.unread || opened.has(item.id)) return;
    setOpened((prev) => new Set(prev).add(item.id));
    announce({ delta: -1 });
    void sendInboxAction({ action: "read", id: item.id });
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const unread = item.unread && !opened.has(item.id);
        return (
          <li key={item.id}>
            <Link href={item.link} onClick={() => open(item)} className="block rounded-xl">
              <Card className={cn("p-4 transition-colors hover:border-border-strong", unread && "border-accent/40")}>
                <div className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", unread ? "bg-accent" : "bg-transparent")}
                  />
                  <div className="min-w-0">
                    <p className={cn("text-sm text-ink", unread ? "font-semibold" : "font-medium")}>
                      {unread ? <span className="sr-only">Unread: </span> : null}
                      {item.title}
                    </p>
                    <p className="mt-0.5 break-words text-sm text-ink-muted">{item.body}</p>
                    <p className="mt-1 text-xs text-ink-muted">{item.when}</p>
                  </div>
                </div>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
