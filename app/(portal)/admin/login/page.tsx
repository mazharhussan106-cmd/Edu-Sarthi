// Owns /admin/login: the admin door. Nothing else — the form is
// components/auth/PortalLogin and the look is components/auth/PortalShell.
//
// It is kept off search engines and is linked from nowhere in the app, so it is
// found only by someone who was told it. That is obscurity, not protection: the
// real guard is the role check at sign-in and the admin pages in proxy.ts.

import type { Metadata } from "next";

import { PortalLogin } from "@/components/auth/PortalLogin";
import { PortalShell } from "@/components/auth/PortalShell";

export const metadata: Metadata = {
  title: "Sign in — EduSarthi",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <PortalShell portal="admin">
      <PortalLogin portal="admin" />
    </PortalShell>
  );
}
