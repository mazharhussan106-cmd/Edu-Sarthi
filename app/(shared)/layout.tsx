// Owns the shell for pages both roles share: settings, profile and the library.
//
// The header links are chosen from the session's role, so a teacher opening
// settings keeps teacher navigation and does not land in a student shell.
//
// It deliberately does NOT guard the route. Middleware already established that
// somebody is signed in and verified before this rendered — with one exception:
// the library list, a deck and a card are open to a visitor with no session
// (PUBLIC_LIBRARY in proxy.ts). That visitor gets the public header and footer,
// never the student app's navigation, which would lead nowhere for them.

import { ensureActiveUser } from "@/lib/activeUser";
import { cardMakerEnabled } from "@/lib/aiEnabled";
import { auth } from "@/lib/auth";
import { Footer } from "@/components/layout/Footer";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { staffNav } from "@/lib/staffNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { PrefSyncServer } from "@/components/layout/PrefSyncServer";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { HeaderStats } from "@/components/layout/HeaderStats";
import { STUDENT_LINKS, studentMore } from "@/lib/studentNav";

export default async function SharedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    );
  }

  await ensureActiveUser();

  const isTeacher =
    session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader
        links={isTeacher ? staffNav(session?.user?.role).links : STUDENT_LINKS}
        search={isTeacher ? undefined : <HeaderSearch />}
        stats={isTeacher ? undefined : <HeaderStats />}
        more={isTeacher ? undefined : studentMore({ member: !session?.user?.isGuest, aiCards: cardMakerEnabled() })}
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
