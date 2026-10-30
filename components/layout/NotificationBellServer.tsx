// Owns reading the unread count for the header bell on the server, so the
// number is right on first paint without a request from the phone. The bell
// itself (NotificationBell) is a client component and keeps the count fresh.
//
// It renders nothing when nobody is signed in, and deliberately does no access
// checks of its own: the layout around it has already run ensureActiveUser.

import { NotificationBell } from "@/components/layout/NotificationBell";
import { auth } from "@/lib/auth";
import { unreadCount } from "@/lib/notifications";

export async function NotificationBellServer() {
  const session = await auth();
  const id = session?.user?.id;
  const role = session?.user?.role;
  if (!id || !role) return null;
  // A failed count must not take the page down with it: the bell starts at
  // zero and corrects itself on the next page.
  const unread = await unreadCount(id, role).catch(() => 0);
  return <NotificationBell initialUnread={unread} />;
}
