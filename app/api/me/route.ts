// Owns the student's data rights under India's DPDP Act: GET downloads
// everything stored about the account as JSON, DELETE erases the account,
// its submissions, their audits and the recordings in storage.
//
// It deliberately refuses deletion for teacher and admin accounts. Their
// audits belong to students' records too; removing them needs a person to
// decide what happens to that history, not a button.

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { removeObjects } from "@/lib/storage";
import { deleteAccountSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired. Sign in and try again." }, { status: 401 });
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
      enrollments: { select: { moduleId: true, createdAt: true } },
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

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), account: data }, null, 2), {
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

  // Rows first, files second. If storage fails the account is still gone and
  // the orphaned files are unreachable (no row points at them); the other
  // order could leave a live account whose recordings have vanished.
  await prisma.user.delete({ where: { id: userId } });
  await removeObjects(keys.map((k) => k.mediaUrl));

  return NextResponse.json({ ok: true });
}
