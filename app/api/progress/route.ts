// Owns the small numbers the header shows on every student page: the streak
// and the XP with its stage. The header asks again after each page change,
// because a layout is not re-rendered on client navigation and the numbers
// change as the student studies.
//
// It deliberately returns only those three numbers, for the signed-in student
// only. Teachers and admins have no streak; they get 404, and their header
// shows nothing.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";
import { currentStreak } from "@/lib/freeze";
import { stageOf } from "@/lib/streak";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;
  if (gate.role !== "STUDENT") return NextResponse.json({ error: "Only students have a streak." }, { status: 404 });

  const row = await prisma.user.findUnique({ where: { id: gate.id }, select: { preferences: true } });
  const prefs = prefsOf(row?.preferences);
  const st = await currentStreak(gate.id, prefs.dailyGoalXp, prefs.weeklyGoalDays);
  return NextResponse.json(
    { streak: st.streak, xp: st.total, stage: stageOf(st.total).stage },
    { headers: { "Cache-Control": "no-store" } },
  );
}
