// Owns the one-time line a teacher or admin sees after signing in at the
// student door (/login): where their own sign-in page is. The owner chose to
// let them in there rather than refuse them (30 Oct), and not to link the
// teacher door from the student page, so this is where they learn it.
//
// It deliberately shows only to a signed-in teacher or admin, so the admin
// door is named only to an admin, and reads only the student-door cookie
// (lib/portals), never anything that identifies a person.

import { cookies } from "next/headers";

import { DoorNoteLine } from "@/components/auth/DoorNoteLine";
import { PORTAL_PATH, STUDENT_DOOR_COOKIE } from "@/lib/portals";

export async function DoorNote({ role }: { role: string | undefined }) {
  if (role !== "TEACHER" && role !== "ADMIN") return null;
  if ((await cookies()).get(STUDENT_DOOR_COOKIE)?.value !== "1") return null;
  return <DoorNoteLine path={role === "ADMIN" ? PORTAL_PATH.admin : PORTAL_PATH.teacher} who={role === "ADMIN" ? "Admins" : "Teachers"} />;
}
