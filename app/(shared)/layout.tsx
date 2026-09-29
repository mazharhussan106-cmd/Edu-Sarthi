// Owns the shell for pages both roles share: settings and profile.
//
// The header links are chosen from the session's role, so a teacher opening
// settings keeps teacher navigation and does not land in a student shell.
//
// It deliberately does NOT guard the route. Middleware already established that
// somebody is signed in and verified before this rendered.

import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import type { NavLink } from "@/components/layout/NavLinks";
import { BottomNav } from "@/components/layout/BottomNav";
import { STUDENT_LINKS } from "@/lib/studentNav";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";

const TEACHER_LINKS: readonly NavLink[] = [
  { href: "/queue", label: "Queue" },
  { href: "/students", label: "Students" },
];

export default async function SharedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [cookieStore, session] = await Promise.all([cookies(), auth()]);
  const theme = themeFromCookie(cookieStore.get(THEME_COOKIE)?.value);

  const isTeacher =
    session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader
        links={isTeacher ? TEACHER_LINKS : STUDENT_LINKS}
        theme={theme}
        homeHref={isTeacher ? "/queue" : "/dashboard"}
      />
      <div className="flex-1">{children}</div>
      <div className={isTeacher ? undefined : "pb-16 md:pb-0"}>
        <Footer />
      </div>
      {isTeacher ? null : <BottomNav />}
    </div>
  );
}
