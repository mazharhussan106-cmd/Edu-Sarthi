// Owns the test data for the Profile browser tests: five accounts (a busy
// student, a new student, a guest, a teacher, an admin), two helpers (another
// student, a throwaway account to delete) and their recordings, audits, card
// answers, decks, institute and admin-log rows.
//
// It deletes these accounts and everything they own, then makes them again,
// with dates counted back from now. So the numbers the tests expect (27
// practice days, an 11-day streak, 15 audits) are true on any day it runs.
//
// LOCAL DATABASE ONLY. It refuses to run unless DATABASE_URL points at
// localhost: the accounts share one known password.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) {
  console.error("Refusing to seed: DATABASE_URL is not a local database.");
  process.exit(1);
}

const p = new PrismaClient();
const DAY = 86_400_000;
const now = Date.now();
// A time on the India day `d` days ago, at hour `h` India time.
const ago = (d, h = 10) => {
  const istMidnight = Math.floor((now + 5.5 * 3_600_000) / DAY) * DAY - 5.5 * 3_600_000;
  return new Date(istMidnight - d * DAY + h * 3_600_000);
};
const EMAILS = ["student", "new", "guest", "teacher", "admin", "other", "del"].map((n) => `${n}@test.local`);

async function reset() {
  const ids = (await p.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } })).map((u) => u.id);
  // Audits outlive a teacher's account by design, so they go first.
  await p.feedback.deleteMany({ where: { OR: [{ teacherId: { in: ids } }, { submission: { studentId: { in: ids } } }] } });
  await p.submission.deleteMany({ where: { studentId: { in: ids } } });
  await p.adminLog.deleteMany({ where: { actorId: { in: ids } } });
  await p.institute.deleteMany({ where: { joinCode: "E2E-SUN" } });
  await p.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await reset();
  const hash = await bcrypt.hash("Test-pass-123", 4);
  const mk = (who, data) => p.user.create({ data: { email: `${who}@test.local`, emailVerified: new Date(now - 30 * DAY), passwordHash: hash, ...data } });
  const student = await mk("student", { name: "Rahul Sharma", publicId: "STU-7K3Q9P", phone: "9876543210", createdAt: new Date(now - 60 * DAY), preferences: { goal: "ielts", level: "intermediate" } });
  await mk("new", { publicId: "STU-Q4M2ZD" });
  await mk("guest", { isGuest: true, publicId: "STU-GUEST1" });
  const teacher = await mk("teacher", { name: "Priya Nair", role: "TEACHER", publicId: "TCH-PRIYA1", teacherVerifiedAt: new Date(now - 40 * DAY), createdAt: new Date(now - 80 * DAY) });
  const admin = await mk("admin", { name: "Arif Khan", role: "ADMIN", publicId: "ADM-ARIF01", createdAt: new Date(now - 90 * DAY) });
  const other = await mk("other", { name: "Other Student", publicId: "STU-OTHER1" });
  await mk("del", { publicId: "STU-DELETE" });

  let mod = await p.module.findFirst({ where: { title: "E2E module" } });
  if (!mod) mod = await p.module.create({ data: { level: 1, title: "E2E module", description: "Profile tests", exercises: { create: [{ title: "Say your name", prompt: "Speak.", expects: "AUDIO" }] } } });
  const ex = await p.exercise.findFirst({ where: { moduleId: mod.id } });

  // 20 recordings; the first 14 audited with rising scores; a run ending today.
  const days = [50, 47, 44, 41, 38, 35, 32, 29, 26, 22, 18, 14, 10, 6, 5, 4, 3, 2, 1, 0];
  for (let i = 0; i < days.length; i++) {
    const reviewed = i < 14;
    const sub = await p.submission.create({ data: { studentId: student.id, exerciseId: ex.id, status: reviewed ? "REVIEWED" : "PENDING", mediaUrl: "/sample.mp3", mediaKind: "AUDIO", durationSec: 40, createdAt: ago(days[i]), claimedById: reviewed ? teacher.id : null, claimedAt: reviewed ? ago(days[i], 12) : null } });
    if (!reviewed) continue;
    const s = (base) => Math.min(10, Math.round(base + i * 0.25));
    await p.feedback.create({ data: { submissionId: sub.id, teacherId: teacher.id, pronunciation: s(5), grammar: s(5), fluency: s(4), vocabulary: 5, confidence: s(5), summary: "Good work.", createdAt: new Date(ago(days[i]).getTime() + (6 + i) * 3_600_000), qaFlaggedAt: i === 12 ? new Date(now - 5 * DAY) : null, qaNote: i === 12 ? "Grammar score looks high for this recording; please check the second minute." : null } });
  }
  const o = await p.submission.create({ data: { studentId: other.id, exerciseId: ex.id, status: "REVIEWED", mediaUrl: "/sample.mp3", mediaKind: "AUDIO", createdAt: ago(3) } });
  await p.feedback.create({ data: { submissionId: o.id, teacherId: teacher.id, pronunciation: 6, grammar: 6, fluency: 6, vocabulary: 6, confidence: 6, summary: "Fine.", createdAt: new Date(ago(3).getTime() + 5 * 3_600_000) } });
  await p.submission.create({ data: { studentId: other.id, exerciseId: ex.id, status: "PENDING", mediaUrl: "/sample.mp3", mediaKind: "AUDIO", createdAt: ago(0) } });

  // Built-in words for card states; card-only practice days fill gaps.
  for (let i = 1; i <= 40; i++) {
    const code = `E2E${String(i).padStart(4, "0")}`;
    await p.word.upsert({ where: { code }, update: {}, create: { kind: "WORD", code, serial: 90000 + i, text: `e2eword${i}`, details: {} } });
  }
  const words = await p.word.findMany({ where: { code: { startsWith: "E2E" } }, orderBy: { serial: "asc" } });
  for (let i = 0; i < 34; i++) await p.cardState.create({ data: { userId: student.id, wordId: words[i].id, known: i < 31, stage: 2, dueAt: new Date(now + 3 * DAY), reviews: 2, lastReviewedAt: ago(1) } });
  for (const d of [0, 7, 8, 9, 25, 26, 27, 28, 29, 30]) for (let k = 0; k < (d % 4) + 2; k++) await p.reviewLog.create({ data: { userId: student.id, wordId: words[k].id, known: true, stage: 1, createdAt: ago(d, 9 + k) } });

  await p.deck.create({ data: { ownerId: student.id, title: "My phrasal verbs", shareToken: `e2e-${now}` } });
  const pub = await p.deck.create({ data: { ownerId: student.id, title: "Interview answers", visibility: "PUBLIC", status: "APPROVED" } });
  await p.deckFollow.create({ data: { userId: other.id, deckId: pub.id } });
  const tdeck = await p.deck.create({ data: { ownerId: teacher.id, title: "Daily chunks", visibility: "PUBLIC", status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date(now - 2 * DAY) } });
  await p.deckFollow.create({ data: { userId: student.id, deckId: tdeck.id } });
  await p.deck.create({ data: { ownerId: other.id, title: "Waiting deck", visibility: "PUBLIC", status: "PENDING_REVIEW" } });

  const inst = await p.institute.create({ data: { name: "Sunrise Institute", description: "Test", contact: "x", status: "APPROVED", joinCode: "E2E-SUN" } });
  await p.instituteMember.create({ data: { instituteId: inst.id, userId: student.id, role: "STUDENT" } });
  await p.instituteMember.create({ data: { instituteId: inst.id, userId: teacher.id, role: "TEACHER" } });

  for (const [action, d] of [["Approved deck", 0.1], ["Approved institute logo", 0.3], ["Suspended user", 2], ["Started announcement", 3], ["Sent deck back", 9]]) {
    await p.adminLog.create({ data: { actorId: admin.id, action, targetType: "deck", createdAt: new Date(now - d * DAY) } });
  }
}

main()
  .then(() => console.log("Seeded the Profile test accounts."))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
