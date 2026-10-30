// Owns /login, the student sign-in door (lib/portals): code or password,
// Google and guest, and the link to create an account. Teachers and admins
// may still sign in here (the owner's decision of 30 Oct); their own pages
// then tell them, once, where their door is (DoorNote).
//
// It deliberately keeps this address: dozens of links, emails and proxy
// redirects point at /login. The form itself is PortalLogin.

import { PortalLogin } from "@/components/auth/PortalLogin";

export default function LoginPage() {
  return <PortalLogin portal="student" />;
}
