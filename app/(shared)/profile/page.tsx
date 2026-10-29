// Owns the /profile route: who is looking, and which Profile they get. A
// student or guest gets the learner's Profile; a teacher or admin gets the
// staff one. Each lives in components/profile.
//
// The role is read from the account row, not the session token, which can be
// older than a promotion or a demotion. It deliberately holds no layout.

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentProfile } from "@/lib/profileStats";
import { StaffProfile } from "@/components/profile/StaffProfile";
import { StudentProfile } from "@/components/profile/StudentProfile";

export const revalidate = 0;

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const row = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!row) redirect("/login");

  if (row.role !== "STUDENT") return <StaffProfile userId={userId} role={row.role} />;
  const data = await studentProfile(userId);
  if (!data) redirect("/login");
  return <StudentProfile data={data} />;
}
