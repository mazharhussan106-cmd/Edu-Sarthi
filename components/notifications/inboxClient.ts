// Owns the browser side of the inbox: telling the header bell the new count
// the moment something is marked read, and sending the read marks.
//
// The bell sits in a layout, which does not re-render on navigation, so it
// cannot learn the count from the page. A window event is the one channel the
// inbox page and the bell both have without a shared React tree.
// It deliberately holds no React state; the components decide what to show.

import { callApi } from "@/components/decks/deckClient";

export const INBOX_EVENT = "edusarthi:inbox";

/// Either the exact count from the server, or a change to apply to the current one.
export type InboxEventDetail = { unread: number } | { delta: number };

export function announce(detail: InboxEventDetail): void {
  window.dispatchEvent(new CustomEvent<InboxEventDetail>(INBOX_EVENT, { detail }));
}

type InboxAction = { action: "read"; id: string } | { action: "read-all" } | { action: "notices-seen"; ids: string[] };

/// Posts one read mark and passes the server's new count to the bell.
export async function sendInboxAction(body: InboxAction): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await callApi<{ unread?: unknown }>("/api/notifications", body);
  if (!res.ok) return res;
  if (typeof res.data.unread === "number") announce({ unread: res.data.unread });
  return { ok: true };
}
