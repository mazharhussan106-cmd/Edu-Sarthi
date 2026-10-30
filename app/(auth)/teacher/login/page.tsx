// Owns /teacher/login, the teacher sign-in door (lib/portals): code or
// password only, existing teacher and admin accounts only (lib/doorAuth).
//
// It deliberately has no Google, guest or "create an account": teacher
// accounts are set up by hand, and nothing is created here.

import { PortalLogin } from "@/components/auth/PortalLogin";

export const metadata = { title: "Teacher sign in — EduSarthi" };

export default function TeacherLoginPage() {
  return <PortalLogin portal="teacher" />;
}
