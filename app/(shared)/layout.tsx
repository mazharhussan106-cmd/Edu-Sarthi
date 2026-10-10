// Owns the shell for pages both roles share: settings and profile.
//
// The header links are chosen from the session's role, so a teacher opening
// settings keeps teacher navigation and does not land in a student shell.
//
// It deliberately does NOT guard the route. Middleware already established that
// somebody is signed in and verified before this rendered.

import { cookies } from "next/headers";

import { ensureActiveUser } from "@/lib/activeUser";
import { auth } from "@/lib/auth";
import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { staffNav } from "@/lib/staffNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { PrefSyncServer } from "@/components/layout/PrefSyncServer";
import { SettingsPanel } from "@/components/layout/SettingsPanel";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { STUDENT_LINKS, STUDENT_MORE } from "@/lib/studentNav";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";

export default async function SharedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await ensureActiveUser();
  const [cookieStore, session] = await Promise.all([cookies(), auth()]);
  const theme = themeFromCookie(cookieStore.get(THEME_COOKIE)?.value);

  const isTeacher =
    session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader
        links={isTeacher ? staffNav(session?.user?.role).links : STUDENT_LINKS}
        theme={theme}
        search={isTeacher ? undefined : <HeaderSearch />}
        more={isTeacher ? undefined : STUDENT_MORE}
        settingsPanel={<SettingsPanel />}
        homeHref={isTeacher ? staffNav(session?.user?.role).home : "/dashboard"}
      />
      <PrefSyncServer />
      <div className="flex-1">{children}</div>
      <div className={isTeacher ? undefined : "pb-16 md:pb-0"}>
        <Footer />
      </div>
      {isTeacher ? null : <BottomNav />}
    </div>
  );
}
