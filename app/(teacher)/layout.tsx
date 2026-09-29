// Owns the shell for every teacher page. Same structure as the student layout,
// different links — which is the point of the route groups: navigation differs
// structurally, not by hiding items from a shared list.

import { cookies } from "next/headers";

import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import type { NavLink } from "@/components/layout/NavLinks";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";

const TEACHER_LINKS: readonly NavLink[] = [
  { href: "/queue", label: "Queue" },
  { href: "/students", label: "Students" },
];

export default async function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = themeFromCookie(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader links={TEACHER_LINKS} theme={theme} homeHref="/queue" />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
