// Owns the student app's top-level destinations. The desktop header and the
// mobile bottom bar both read this list, so the two can never disagree about
// what "Learn" points at.
//
// It deliberately holds no icons. Icons are React components, and this file
// is imported by server layouts that should not pull in client code.

import type { NavLink } from "@/components/layout/NavLinks";

export const STUDENT_LINKS: readonly NavLink[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/modules", label: "Learn" },
  { href: "/feedback", label: "My Audits" },
  { href: "/profile", label: "Profile" },
];
