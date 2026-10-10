// Owns the header links for staff: teachers and admins. Admins also review, so
// their list is the admin pages plus the queue — one header whichever page
// they are on, instead of the links changing under them between areas.

import type { Role } from "@prisma/client";

import type { NavLink } from "@/components/layout/NavLinks";

export const TEACHER_LINKS: readonly NavLink[] = [
  { href: "/queue", label: "Queue" },
  { href: "/students", label: "Students" },
  { href: "/workload", label: "Workload" },
  { href: "/decks", label: "Decks" },
  { href: "/institute", label: "Institute" },
];

export const ADMIN_LINKS: readonly NavLink[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/dispatch", label: "Dispatch" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/decks", label: "Decks" },
  { href: "/admin/institutes", label: "Institutes" },
  { href: "/admin/notices", label: "Notices" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/compliance", label: "Compliance" },
  { href: "/queue", label: "Queue" },
  { href: "/decks", label: "My decks" },
];

export function staffNav(role: Role | undefined): { links: readonly NavLink[]; home: string } {
  return role === "ADMIN"
    ? { links: ADMIN_LINKS, home: "/admin" }
    : { links: TEACHER_LINKS, home: "/queue" };
}
