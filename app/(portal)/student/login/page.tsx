// Owns /student/login: the student door. Nothing else — the form is
// components/auth/PortalLogin and the look is components/auth/PortalShell.

import type { Metadata } from "next";

import { PortalLogin } from "@/components/auth/PortalLogin";
import { PortalShell } from "@/components/auth/PortalShell";

export const metadata: Metadata = { title: "Student sign in — EduSarthi" };

export default function StudentLoginPage() {
  return (
    <PortalShell portal="student">
      <PortalLogin portal="student" />
    </PortalShell>
  );
}
