// Owns the overview's CSV export: every submission from the last 30 days with
// its status, timings and scores, keyed by the anonymized student ID.
//
// Names, emails and phone numbers are deliberately left out. A CSV gets
// emailed around; an anonymized one can be.

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Quoted when needed, and a leading = + - @ is neutralised so a spreadsheet
  // never runs a formula someone typed into an exercise title.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const rows = await prisma.submission.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      mediaKind: true,
      durationSec: true,
      returnReason: true,
      student: { select: { publicId: true } },
      exercise: { select: { title: true, module: { select: { level: true } } } },
      feedback: {
        select: { createdAt: true, pronunciation: true, grammar: true, fluency: true, vocabulary: true, confidence: true },
      },
    },
  });

  const header = [
    "submission_id", "sent_at", "student", "exercise", "level", "media", "duration_sec", "status",
    "return_reason", "audited_at", "hours_to_audit", "pronunciation", "grammar", "fluency", "vocabulary", "confidence",
  ];
  const lines = rows.map((r) => {
    const f = r.feedback;
    return [
      r.id, r.createdAt.toISOString(), r.student.publicId, r.exercise.title, r.exercise.module.level, r.mediaKind,
      r.durationSec, r.status, r.returnReason, f?.createdAt.toISOString(),
      f ? ((f.createdAt.getTime() - r.createdAt.getTime()) / 3_600_000).toFixed(1) : "",
      f?.pronunciation, f?.grammar, f?.fluency, f?.vocabulary, f?.confidence,
    ].map(cell).join(",");
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse([header.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="edusarthi-submissions-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
