// Owns which notices a student sees right now: not yet expired, newest first,
// with upcoming events ahead of plain announcements.
//
// A notice with no expiry stays until its event time passes; one with neither
// stays until an admin deletes it. Nothing here is per-student — a notice is
// for everyone, so there is no user scoping to get wrong. Who has seen which
// notice (the inbox's read state) lives in lib/notifications.

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type NoticeRow = { id: string; title: string; body: string; eventAt: Date | null };

/// The one definition of "still showing", shared with the inbox so a notice
/// never counts as unread there after it has left the dashboard.
export function activeNoticeWhere(now: Date): Prisma.NoticeWhereInput {
  return {
    AND: [
      { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      // With no explicit expiry, an event that has passed is over.
      { OR: [{ expiresAt: { not: null } }, { eventAt: null }, { eventAt: { gt: now } }] },
    ],
  };
}

/// Soonest event first, then the rest newest first: "what is coming up" is the
/// useful order on a dashboard and in the inbox alike.
export function upcomingFirst<T extends { eventAt: Date | null }>(rows: T[]): T[] {
  const dated = rows.filter((r) => r.eventAt).sort((a, b) => a.eventAt!.getTime() - b.eventAt!.getTime());
  return [...dated, ...rows.filter((r) => !r.eventAt)];
}

export async function activeNotices(limit = 5): Promise<NoticeRow[]> {
  const rows = await prisma.notice.findMany({
    where: activeNoticeWhere(new Date()),
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, body: true, eventAt: true },
  });
  return upcomingFirst(rows).slice(0, limit);
}

/// "Sat, 18 Oct, 5:00 pm" in India time, because that is when students will
/// show up, whatever timezone the server runs in.
export function formatEvent(d: Date): string {
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}
