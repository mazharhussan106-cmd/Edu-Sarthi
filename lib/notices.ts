// Owns which notices a student sees right now: not yet expired, newest first,
// with upcoming events ahead of plain announcements.
//
// A notice with no expiry stays until its event time passes; one with neither
// stays until an admin deletes it. Nothing here is per-student — a notice is
// for everyone, so there is no user scoping to get wrong.

import { prisma } from "@/lib/prisma";

export type NoticeRow = { id: string; title: string; body: string; eventAt: Date | null };

export async function activeNotices(limit = 5): Promise<NoticeRow[]> {
  const now = new Date();
  const rows = await prisma.notice.findMany({
    where: {
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        // With no explicit expiry, an event that has passed is over.
        { OR: [{ expiresAt: { not: null } }, { eventAt: null }, { eventAt: { gt: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, body: true, eventAt: true },
  });
  // Soonest event first, then the rest newest first: "what is coming up" is the
  // useful order on a dashboard.
  const dated = rows.filter((r) => r.eventAt).sort((a, b) => a.eventAt!.getTime() - b.eventAt!.getTime());
  return [...dated, ...rows.filter((r) => !r.eventAt)].slice(0, limit);
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
