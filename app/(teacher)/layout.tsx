// Owns the shell for every teacher page. Same structure as the student layout,
// different links — which is the point of the route groups: navigation differs
// structurally, not by hiding items from a shared list.

import { cookies } from "next/headers";

import { ensureActiveUser } from "@/lib/activeUser";
import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { auth } from "@/lib/auth";
import { staffNav } from "@/lib/staffNav";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";

export default async function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await ensureActiveUser(["TEACHER", "ADMIN"]);
  const [cookieStore, session] = await Promise.all([cookies(), auth()]);
  const theme = themeFromCookie(cookieStore.get(THEME_COOKIE)?.value);
  const nav = staffNav(session?.user?.role);

  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader links={nav.links} theme={theme} homeHref={nav.home} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
