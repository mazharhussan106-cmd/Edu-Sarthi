// Owns /teacher/login: the teacher door. Nothing else — the form is
// components/auth/PortalLogin and the look is components/auth/PortalShell.

import type { Metadata } from "next";

import { PortalLogin } from "@/components/auth/PortalLogin";
import { PortalShell } from "@/components/auth/PortalShell";

export const metadata: Metadata = { title: "Teacher sign in — EduSarthi" };

export default function TeacherLoginPage() {
  return (
    <PortalShell portal="teacher">
      <PortalLogin portal="teacher" />
    </PortalShell>
  );
}
