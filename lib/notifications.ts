// Owns the notification inbox: writing a notification for one person, the
// unread count behind the header bell, the rows the inbox page shows, marking
// them read, and sweeping old ones.
//
// Notices (lib/notices) are written for every student and are not copied into
// each inbox; they join it here, with the read flag taken from NoticeRead.
// Teachers and admins get only their own notifications: a notice is for
// students, and an admin would otherwise see every notice they posted as unread.
//
// It deliberately does NOT send email (lib/email, lib/notify do) and does not
// decide who should hear about an event — callers name the person.

import type { Role } from "@prisma/client";
import { z } from "zod";

import { activeNoticeWhere, upcomingFirst, type NoticeRow } from "@/lib/notices";
import { prisma } from "@/lib/prisma";

export const NOTIFICATION_KINDS = [
  "audit_ready",
  "sent_back",
  "deck_approved",
  "deck_rejected",
  "deck_removed",
  "deck_invite",
  "fix_undone",
  "institute_name_removed",
  "recording_assigned",
  "email_changed",
  "photo_approved",
  "photo_refused",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const PAGE_SIZE = 20;
const TITLE_MAX = 120;
const BODY_MAX = 500;
const DAY_MS = 86_400_000;
/// Owner's decision (28 Oct 2026): read items go after 90 days, unread after 180.
const READ_KEEP_DAYS = 90;
const UNREAD_KEEP_DAYS = 180;
/// The inbox shows at most this many notices, and only those count as unread,
/// so the bell can never promise a notice the page does not show.
const NOTICE_LIMIT = 20;

export type InboxNotice = NoticeRow & { unread: boolean };
export type InboxItem = { id: string; kind: string; title: string; body: string; link: string; createdAt: Date; unread: boolean };

/// A path inside this site. "//host" and "/\host" are other sites to a browser,
/// so a second slash or any backslash is refused, as is whitespace.
export function isInternalPath(link: string): boolean {
  return link.length <= 300 && /^\/(?![/\\])[^\s\\]*$/.test(link);
}

/// Best effort, after the caller's real work has committed: a failure is logged
/// and swallowed, so a notification can never turn a saved audit or an admin's
/// decision into an error on someone's screen.
export async function notify(userId: string, kind: NotificationKind, n: { title: string; body: string; link: string }): Promise<void> {
  try {
    if (!isInternalPath(n.link)) throw new Error(`refused a link that leaves the site (${kind})`);
    await prisma.notification.create({
      data: { userId, kind, title: n.title.slice(0, TITLE_MAX), body: n.body.slice(0, BODY_MAX), link: n.link },
    });
  } catch (err) {
    console.error("Notification not saved", err instanceof Error ? err.message : "unknown error");
  }
}

/// The notices the inbox shows a student, each with whether this student has
/// seen it there. The same query feeds the count, the page and "mark all".
async function shownNotices(userId: string): Promise<InboxNotice[]> {
  const rows = await prisma.notice.findMany({
    where: activeNoticeWhere(new Date()),
    orderBy: { createdAt: "desc" },
    take: NOTICE_LIMIT,
    select: { id: true, title: true, body: true, eventAt: true, reads: { where: { userId }, select: { id: true } } },
  });
  return upcomingFirst(rows).map(({ reads, ...n }) => ({ ...n, unread: reads.length === 0 }));
}

export async function inboxNotices(userId: string, role: Role): Promise<InboxNotice[]> {
  return role === "STUDENT" ? shownNotices(userId) : [];
}

export async function unreadCount(userId: string, role: Role): Promise<number> {
  const [own, notices] = await Promise.all([
    prisma.notification.count({ where: { userId, readAt: null } }),
    inboxNotices(userId, role),
  ]);
  return own + notices.filter((n) => n.unread).length;
}

/// One page of the person's own notifications, newest first. The cursor comes
/// from the URL, but the where clause is always this person, so a cursor naming
/// someone else's row only changes where the page starts, never whose rows show.
export async function inboxPage(userId: string, cursor?: string): Promise<{ items: InboxItem[]; nextCursor: string | null }> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, kind: true, title: true, body: true, link: true, createdAt: true, readAt: true },
  });
  const items = rows.slice(0, PAGE_SIZE).map(({ readAt, ...r }) => ({ ...r, unread: readAt === null }));
  return { items, nextCursor: rows.length > PAGE_SIZE ? items[items.length - 1].id : null };
}

export async function markRead(userId: string, id: string): Promise<void> {
  await prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
}

/// Only notices still showing are recorded: an id from an old page, or one that
/// never existed, is dropped instead of stored.
export async function markNoticesSeen(userId: string, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const live = await prisma.notice.findMany({ where: { id: { in: [...ids] }, ...activeNoticeWhere(new Date()) }, select: { id: true } });
  if (live.length === 0) return;
  await prisma.noticeRead.createMany({ data: live.map((n) => ({ userId, noticeId: n.id })), skipDuplicates: true });
}

export async function markAllRead(userId: string, role: Role): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  const notices = await inboxNotices(userId, role);
  await markNoticesSeen(userId, notices.filter((n) => n.unread).map((n) => n.id));
}

/// Called by the daily retention cron. Unbounded on purpose: a day's worth of
/// expired rows is small, and an index on createdAt covers both conditions.
export async function sweepNotifications(now = new Date()): Promise<number> {
  const res = await prisma.notification.deleteMany({
    where: {
      OR: [
        { readAt: { not: null }, createdAt: { lt: new Date(now.getTime() - READ_KEEP_DAYS * DAY_MS) } },
        { createdAt: { lt: new Date(now.getTime() - UNREAD_KEEP_DAYS * DAY_MS) } },
      ],
    },
  });
  return res.count;
}

/// What the browser may ask of /api/notifications. Ids are cuids; the length
/// cap only stops a huge body, the where clause does the real scoping.
const id = z.string().min(1).max(40);
export const inboxActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read"), id }),
  z.object({ action: z.literal("read-all") }),
  z.object({ action: z.literal("notices-seen"), ids: z.array(id).min(1).max(NOTICE_LIMIT) }),
]);
