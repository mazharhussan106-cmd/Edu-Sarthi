// Owns the numbers on a teacher's and an admin's Profile: their own audits,
// students helped, turnaround, quality notes, decks, and an admin's own
// recent actions. Every number is about the person looking, never the site.
//
// The waiting count uses queueScope, the same rule as the Queue page, so the
// two can never disagree. It deliberately does NOT draw anything.

import { Prisma, type Role } from "@prisma/client";

import { queueScope } from "@/lib/claims";
import { prisma } from "@/lib/prisma";

const DAY = 86_400_000;
const IST = 5.5 * 3_600_000;

export type StaffUser = {
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  emailVerified: Date | null;
  teacherVerifiedAt: Date | null;
  institute: { name: string; role: string } | null;
};

async function staffUser(userId: string): Promise<StaffUser | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      emailVerified: true,
      teacherVerifiedAt: true,
      instituteMembership: { select: { role: true, institute: { select: { name: true } } } },
    },
  });
  if (!u) return null;
  const { instituteMembership: m, ...rest } = u;
  return { ...rest, institute: m ? { name: m.institute.name, role: m.role.toLowerCase() } : null };
}

/// Rows per India day for one table's createdAt, keyed by day number. The
/// table and column names come from the fixed types above, never from input,
/// which is why Prisma.raw is safe for them.
async function perDay(table: "Feedback" | "AdminLog", column: "teacherId" | "actorId", userId: string): Promise<Map<number, number>> {
  const since = new Date(Date.now() - 400 * DAY);
  const rows = await prisma.$queryRaw<{ day: number; n: number }[]>(Prisma.sql`
    SELECT FLOOR((EXTRACT(EPOCH FROM "createdAt") + 19800) / 86400)::int AS day, COUNT(*)::int AS n
    FROM ${Prisma.raw(`"${table}"`)} WHERE ${Prisma.raw(`"${column}"`)} = ${userId} AND "createdAt" >= ${since} GROUP BY 1`);
  return new Map(rows.map((r) => [r.day, r.n]));
}

function startOfMonthIst(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST);
}

// The same median as the Workload page (the upper middle value), so the two
// pages show the same number for the same 30 days.
const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null);

export type QaNote = { date: Date; note: string | null };

export async function teacherProfile(userId: string, role: Role) {
  const qaSince = new Date(Date.now() - 90 * DAY);
  const [user, written, thisMonth, students, recent, qa, days, waiting, decks, inLibrary, followers] = await Promise.all([
    staffUser(userId),
    prisma.feedback.count({ where: { teacherId: userId } }),
    prisma.feedback.count({ where: { teacherId: userId, createdAt: { gte: startOfMonthIst() } } }),
    prisma.submission.findMany({ where: { feedback: { teacherId: userId } }, distinct: ["studentId"], select: { studentId: true } }),
    // Audits in the last 30 days, from sent to audited: Workload's 30-day view.
    prisma.feedback.findMany({ where: { teacherId: userId, createdAt: { gte: new Date(Date.now() - 30 * DAY) } }, select: { createdAt: true, submission: { select: { createdAt: true } } } }),
    prisma.feedback.findMany({ where: { teacherId: userId, qaFlaggedAt: { gte: qaSince } }, orderBy: { qaFlaggedAt: "desc" }, take: 10, select: { qaFlaggedAt: true, qaNote: true } }),
    perDay("Feedback", "teacherId", userId),
    prisma.submission.count({ where: { status: "PENDING", ...queueScope(userId, role) } }),
    prisma.deck.count({ where: { ownerId: userId, draftOfId: null } }),
    prisma.deck.count({ where: { ownerId: userId, visibility: "PUBLIC", status: "APPROVED" } }),
    prisma.deckFollow.count({ where: { deck: { ownerId: userId } } }),
  ]);
  if (!user) return null;
  const hours = recent.map((f) => (f.createdAt.getTime() - f.submission.createdAt.getTime()) / 3_600_000);
  return {
    user,
    written,
    thisMonth,
    studentsHelped: students.length,
    turnaroundHours: median(hours),
    qa: qa.map((f): QaNote => ({ date: f.qaFlaggedAt!, note: f.qaNote })),
    days,
    waiting,
    decks: { owned: decks, inLibrary, followers },
  };
}

export async function adminProfile(userId: string) {
  const week = new Date(Date.now() - 7 * DAY);
  const month = new Date(Date.now() - 30 * DAY);
  const [user, actionsThisWeek, reviewed, decksWaiting, logosWaiting, recent, days] = await Promise.all([
    staffUser(userId),
    prisma.adminLog.count({ where: { actorId: userId, createdAt: { gte: week } } }),
    prisma.deck.count({ where: { reviewedById: userId, reviewedAt: { gte: month } } }),
    prisma.deck.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.institute.count({ where: { pendingLogoKey: { not: null } } }),
    prisma.adminLog.findMany({ where: { actorId: userId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, action: true, createdAt: true } }),
    perDay("AdminLog", "actorId", userId),
  ]);
  if (!user) return null;
  return { user, actionsThisWeek, reviewed, decksWaiting, logosWaiting, recent, days };
}
