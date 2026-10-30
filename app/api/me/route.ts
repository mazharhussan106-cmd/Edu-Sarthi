// Owns the student's data rights under India's DPDP Act: GET downloads
// everything stored about the account as JSON (including card progress and
// study history), DELETE erases the account,
// its submissions, their audits and the recordings in storage.
//
// It deliberately refuses deletion for teacher and admin accounts. Their
// audits belong to students' records too; removing them needs a person to
// decide what happens to that history, not a button.

import { NextResponse } from "next/server";

import { isRevoked } from "@/lib/activeUser";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mediaKeys } from "@/lib/decks";
import { removeObjects } from "@/lib/storage";
import { avatarUrl } from "@/lib/avatar";
import { deleteAccountSchema } from "@/lib/validations";
import { logAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Sign in and try again." }, { status: 401 });
  }
  // Revocation only, not requireUser(): a suspended student still has the right
  // to their data, but a thief's token from a signed-out device must not.
  const revokedRow = await prisma.user.findUnique({ where: { id: userId }, select: { sessionsValidFrom: true } });
  if (isRevoked(session.user.loginAt, revokedRow?.sessionsValidFrom ?? null)) {
    return NextResponse.json({ error: "You were signed out of all devices. Sign in again." }, { status: 401 });
  }

  // An explicit select, not the whole row: the password hash is "stored
  // about" the user but handing it out helps nobody and helps an attacker.
  const data = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      publicId: true,
      name: true,
      email: true,
      emailVerified: true,
      phone: true,
      role: true,
      theme: true,
      preferences: true,
      createdAt: true,
      // What they told us when publishing, and what they agreed to per deck:
      // a record of consent is data about them too.
      adultConfirmedAt: true,
      creditStyle: true,
      publicName: true,
      avatarKey: true,
      decks: { where: { termsAcceptedAt: { not: null } }, select: { title: true, licence: true, termsVersion: true, termsAcceptedAt: true } },
      enrollments: { select: { moduleId: true, createdAt: true } },
      // Card progress and the answer-by-answer study history are personal data
      // stored about the student too. Capped so a very long history cannot make
      // the download exhaust memory; oldest first, like submissions.
      cardStates: {
        select: {
          known: true,
          recall: true,
          stage: true,
          dueAt: true,
          reviews: true,
          lastReviewedAt: true,
          firstReviewedAt: true,
          confident: true,
          important: true,
          favourite: true,
          doubt: true,
          note: true,
          word: { select: { code: true, text: true } },
        },
      },
      reviewLogs: {
        orderBy: { createdAt: "asc" },
        take: 50_000,
        select: { createdAt: true, known: true, recall: true, stage: true, word: { select: { code: true, text: true } } },
      },
      submissions: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          status: true,
          mediaKind: true,
          durationSec: true,
          returnReason: true,
          returnNote: true,
          exercise: { select: { title: true, prompt: true } },
          feedback: {
            select: {
              pronunciation: true,
              grammar: true,
              fluency: true,
              vocabulary: true,
              confidence: true,
              summary: true,
              notes: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  // The dashboard's streak freezes, read on their own and caught: in the
  // minutes between a deploy and Database setup the tables may not exist, and
  // the rest of the download must not fail for them.
  const streak = await Promise.all([
    prisma.streakLedger.findUnique({ where: { userId }, select: { held: true, weeksMet: true, checkedThrough: true } }),
    prisma.streakFreeze.findMany({ where: { userId }, orderBy: { day: "asc" }, select: { day: true, createdAt: true } }),
  ])
    .then(([ledger, frozenDays]) => ({ ledger, frozenDays }))
    .catch(() => null);

  // The compliance record of a data-access request: who (by student ID
  // only) and when. The export's contents are not logged.
  await logAdmin(null, "Student exported own data", "user", data?.publicId ?? null);

  // The photo itself, as a link that works for about half an hour: a file is
  // the data, a storage key is only our filing reference.
  const { avatarKey, ...account } = data ?? { avatarKey: null };
  const profilePhoto = avatarKey ? { link: await avatarUrl(avatarKey), linkExpires: "about 30 minutes after this export" } : null;

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), account: data ? { ...account, profilePhoto } : null, streakFreezes: streak }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="edusarthi-my-data-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Sign in and try again." }, { status: 401 });
  }
  // Revocation only, not requireUser(): a suspended student still has the right
  // to their data, but a thief's token from a signed-out device must not.
  const revokedRow = await prisma.user.findUnique({ where: { id: userId }, select: { sessionsValidFrom: true } });
  if (isRevoked(session.user.loginAt, revokedRow?.sessionsValidFrom ?? null)) {
    return NextResponse.json({ error: "You were signed out of all devices. Sign in again." }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Teacher and admin accounts are closed by support. Email support@edusarthi.com." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Type DELETE to confirm." }, { status: 400 });
  }

  const keys = await prisma.submission.findMany({ where: { studentId: userId }, select: { mediaUrl: true } });
  // Pictures and recordings on the student's own flashcards.
  const cardMedia = await prisma.word.findMany({ where: { ownerId: userId }, select: { imageUrl: true, audioUrl: true } });
  // Files added for the AI card maker that are still waiting to be used.
  const sourceFiles = await prisma.aiSource.findMany({ where: { userId }, select: { key: true } });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { publicId: true, avatarKey: true } });

  // Rows first, files second. If storage fails the account is still gone and
  // the orphaned files are unreachable (no row points at them); the other
  // order could leave a live account whose recordings have vanished.
  try {
    // Earlier admin-log entries about this person may hold their email in
    // `detail`; the log line stays, the personal data does not.
    await prisma.adminLog.updateMany({ where: { targetType: "user", targetId: userId }, data: { detail: { redacted: true } } });
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    return NextResponse.json(
      { error: "We could not delete the account just now. Nothing was lost; try again in a minute, and if it keeps failing write to support from the Support page." },
      { status: 500 },
    );
  }
  const failed = await removeObjects([
    ...keys.map((k) => k.mediaUrl),
    ...mediaKeys(cardMedia),
    ...sourceFiles.map((s) => s.key),
    ...(me?.avatarKey ? [me.avatarKey] : []),
  ]);
  try {
    // Kept as the record that an erasure request was carried out. Only the
    // student ID is stored — the email is exactly what was asked to be erased.
    await logAdmin(null, "Student deleted own account", "user", me?.publicId ?? null, { submissions: keys.length, filesNotDeleted: failed.length });
  } catch {
    // The erasure is done; a log failure must not turn it into an error.
    console.error("Could not write the erasure log entry");
  }

  return NextResponse.json({ ok: true });
}
