// Owns /admin/login, the admin sign-in door (lib/portals): code or password
// only, admin accounts only. Anyone else is answered exactly like a wrong
// password (lib/doorAuth), so the page never confirms that an admin exists.
//
// It deliberately is linked from nowhere and kept out of search engines. That
// only hides it; the real protection is the role check and proxy.ts.

import { PortalLogin } from "@/components/auth/PortalLogin";

export const metadata = { title: "Sign in — EduSarthi", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return <PortalLogin portal="admin" />;
}
