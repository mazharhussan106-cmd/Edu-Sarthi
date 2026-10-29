// Owns the /profile route: who is looking, and which Profile they get: a
// student or guest, a teacher, or an admin. Each lives in components/profile
// and gets its numbers from lib/profileStats or lib/staffProfileStats.
//
// The role is read from the account row, not the session token, which can be
// older than a promotion or a demotion. It deliberately holds no layout.

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentProfile } from "@/lib/profileStats";
import { adminProfile, teacherProfile } from "@/lib/staffProfileStats";
import { AdminProfile } from "@/components/profile/AdminProfile";
import { StudentProfile } from "@/components/profile/StudentProfile";
import { TeacherProfile } from "@/components/profile/TeacherProfile";

export const revalidate = 0;

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const row = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!row) redirect("/login");

  if (row.role === "ADMIN") {
    const data = await adminProfile(userId);
    if (!data) redirect("/login");
    return <AdminProfile data={data} />;
  }
  if (row.role === "TEACHER") {
    const data = await teacherProfile(userId, row.role);
    if (!data) redirect("/login");
    return <TeacherProfile data={data} />;
  }
  const data = await studentProfile(userId);
  if (!data) redirect("/login");
  return <StudentProfile data={data} />;
}
