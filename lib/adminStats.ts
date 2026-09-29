// Owns the numbers on the admin overview: queue depth, SLA breaches, who is
// active, and submissions against audits per day.
//
// "Active" means did something that wrote a row — a student who submitted, a
// teacher who audited or claimed. The app keeps no login or page-view log, and
// counting sessions would need one; these labels say what is actually counted.

import { prisma } from "@/lib/prisma";
import { SLA_HOURS } from "@/lib/claims";

const DAY = 86_400_000;
const IST = 5.5 * 3_600_000;

export function istDay(d: Date): string {
  return new Date(d.getTime() + IST).toISOString().slice(0, 10);
}

export async function overviewStats(days = 14) {
  const now = Date.now();
  const since = new Date(now - days * DAY);
  const slaCutoff = new Date(now - SLA_HOURS * 3_600_000);

  const [pending, inReview, overSla, auditsToday, teacherFeedback, teacherClaims, subs, audits, studentsToday, studentsWeek] =
    await Promise.all([
      prisma.submission.count({ where: { status: "PENDING" } }),
      prisma.submission.count({ where: { status: "IN_REVIEW" } }),
      prisma.submission.count({ where: { status: { in: ["PENDING", "IN_REVIEW"] }, createdAt: { lt: slaCutoff } } }),
      prisma.feedback.count({ where: { createdAt: { gte: new Date(now - DAY) } } }),
      prisma.feedback.findMany({ where: { createdAt: { gte: new Date(now - DAY) } }, select: { teacherId: true }, distinct: ["teacherId"] }),
      prisma.submission.findMany({ where: { claimedAt: { gte: new Date(now - DAY) }, claimedById: { not: null } }, select: { claimedById: true }, distinct: ["claimedById"] }),
      prisma.submission.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.feedback.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.submission.findMany({ where: { createdAt: { gte: new Date(now - DAY) } }, select: { studentId: true }, distinct: ["studentId"] }),
      prisma.submission.findMany({ where: { createdAt: { gte: new Date(now - 7 * DAY) } }, select: { studentId: true }, distinct: ["studentId"] }),
    ]);

  const activeTeachers = new Set([
    ...teacherFeedback.map((t) => t.teacherId),
    ...teacherClaims.map((t) => t.claimedById!),
  ]).size;

  const series = new Map<string, { sent: number; audited: number }>();
  for (let i = days - 1; i >= 0; i--) series.set(istDay(new Date(now - i * DAY)), { sent: 0, audited: 0 });
  for (const s of subs) {
    const bucket = series.get(istDay(s.createdAt));
    if (bucket) bucket.sent += 1;
  }
  for (const a of audits) {
    const bucket = series.get(istDay(a.createdAt));
    if (bucket) bucket.audited += 1;
  }

  return {
    pending,
    inReview,
    overSla,
    auditsToday,
    activeTeachers,
    studentsToday: studentsToday.length,
    studentsWeek: studentsWeek.length,
    series: [...series.entries()].map(([day, v]) => ({ day, ...v })),
  };
}
