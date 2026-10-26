// Owns the queries behind the History pages: a student's practice (recordings
// and their audits) and their study (every card answer, from ReviewLog), plus
// the rule for who may look at which. The student page, the teacher dossier,
// the admin view and the dashboard card all read these, so none can show
// something another one hides.
//
// It does not render anything and does not decide what to do when access is
// refused — callers get null and answer 404, so a refused student looks the
// same as one that does not exist.
//
// Study history starts the day ReviewLog was created; CardState overwrote
// earlier answers, so there is nothing older to show.

import type { Role, SubmissionStatus, ReturnReason, Recall } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { averageScore } from "@/lib/audits";

export type Viewer = { id: string; role: Role };

export const PAGE_SIZE = 20;

const DAY = 86_400_000;
// The student's calendar day, as in studentStats: UTC would split a late
// evening session across two days.
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/// Whose history a viewer may open at all. Students: their own. Admins: any
/// (the caller logs it). Teachers: only students they have a working
/// relationship with — claimed, been assigned, or audited — because a student's
/// whole study log is more than any teacher needs to see.
export async function canViewHistory(viewer: Viewer, studentId: string): Promise<boolean> {
  if (viewer.role === "ADMIN") return true;
  if (viewer.role === "STUDENT") return viewer.id === studentId;
  if (viewer.role !== "TEACHER") return false;
  const link = await prisma.submission.findFirst({
    where: {
      studentId,
      OR: [{ claimedById: viewer.id }, { assignedTeacherId: viewer.id }, { feedback: { teacherId: viewer.id } }],
    },
    select: { id: true },
  });
  return !!link;
}

export type PracticeItem = {
  id: string;
  createdAt: Date;
  status: SubmissionStatus;
  title: string;
  /// Flashcard the recording answered, when it came from one.
  cardText: string | null;
  returnReason: ReturnReason | null;
  /// Audio or video was deleted under the retention policy; the audit stays.
  mediaPurged: boolean;
  /// Mean of the five rubric scores, null until an audit is delivered.
  average: number | null;
};

export type Page<T> = { items: T[]; nextCursor: string | null };

export async function practiceHistory(studentId: string, viewer: Viewer, cursor?: string, take = PAGE_SIZE): Promise<Page<PracticeItem>> {
  const rows = await prisma.submission.findMany({
    where: {
      studentId,
      // Same rule as the teacher dossier: recordings made on another teacher's
      // deck are that teacher's alone (admins see all, the student sees theirs).
      ...(viewer.role === "TEACHER" ? { OR: [{ assignedTeacherId: null }, { assignedTeacherId: viewer.id }] } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      status: true,
      returnReason: true,
      mediaPurgedAt: true,
      exercise: { select: { title: true } },
      word: { select: { text: true } },
      feedback: { select: { pronunciation: true, grammar: true, fluency: true, vocabulary: true, confidence: true } },
    },
  });
  const more = rows.length > take;
  const items = rows.slice(0, take).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    title: r.exercise.title,
    cardText: r.word?.text ?? null,
    returnReason: r.returnReason,
    mediaPurged: !!r.mediaPurgedAt,
    average: r.feedback ? averageScore(r.feedback) : null,
  }));
  return { items, nextCursor: more ? items[items.length - 1].id : null };
}

export type StudyItem = {
  id: string;
  createdAt: Date;
  known: boolean;
  recall: Recall | null;
  /// Null when the viewer may not see the card: a teacher or admin never reads
  /// the text of a card from a student's private deck.
  cardText: string | null;
};

export async function studyHistory(studentId: string, viewer: Viewer, cursor?: string): Promise<Page<StudyItem>> {
  const own = viewer.id === studentId;
  const rows = await prisma.reviewLog.findMany({
    where: { userId: studentId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      known: true,
      recall: true,
      word: { select: { text: true, deckId: true, ownerId: true } },
    },
  });
  const more = rows.length > PAGE_SIZE;
  const items = rows.slice(0, PAGE_SIZE).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    known: r.known,
    recall: r.recall,
    cardText: own || (r.word.deckId === null && r.word.ownerId === null) ? r.word.text : null,
  }));
  return { items, nextCursor: more ? items[items.length - 1].id : null };
}

export type StudyDay = { day: string; answers: number; known: number };

/// Per-day totals for the last `days` days, newest first. Capped rows, newest
/// first, so if the cap ever bites it trims the oldest day, not today.
export async function studyDays(studentId: string, days = 30): Promise<StudyDay[]> {
  const since = new Date(Date.now() - days * DAY);
  const rows = await prisma.reviewLog.findMany({
    where: { userId: studentId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: { createdAt: true, known: true },
  });
  const byDay = new Map<string, StudyDay>();
  for (const r of rows) {
    const key = dayKey(r.createdAt);
    const d = byDay.get(key) ?? { day: key, answers: 0, known: 0 };
    d.answers += 1;
    if (r.known) d.known += 1;
    byDay.set(key, d);
  }
  return [...byDay.values()];
}

/// Dates of the student's answers, for streakDays(). Same cap and order as
/// studyDays.
export async function studyDates(studentId: string, days = 60): Promise<Date[]> {
  const rows = await prisma.reviewLog.findMany({
    where: { userId: studentId, createdAt: { gte: new Date(Date.now() - days * DAY) } },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: { createdAt: true },
  });
  return rows.map((r) => r.createdAt);
}

/// The student's "delete my study history" button. Removes only their own rows.
export async function deleteStudyHistory(studentId: string): Promise<number> {
  const res = await prisma.reviewLog.deleteMany({ where: { userId: studentId } });
  return res.count;
}
