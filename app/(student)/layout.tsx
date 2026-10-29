// Owns the shell for every student page: header with student navigation, and
// the footer.
//
// It deliberately does NOT check the role. Middleware already did, before the
// page started rendering — repeating it here would be a second place to
// forget when a route is added.

import { ensureActiveUser } from "@/lib/activeUser";
import { cardMakerEnabled } from "@/lib/aiEnabled";
import { auth } from "@/lib/auth";
import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { PrefSyncServer } from "@/components/layout/PrefSyncServer";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { HeaderStats } from "@/components/layout/HeaderStats";
import { STUDENT_LINKS, studentMore } from "@/lib/studentNav";

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await ensureActiveUser();
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Streak and XP on every page (docs/DASHBOARD-PLAN.md, Phase 4). */}
      <StickyHeader links={STUDENT_LINKS} homeHref="/dashboard" stats={<HeaderStats />} search={<HeaderSearch />} more={studentMore({ member: !session?.user?.isGuest, aiCards: cardMakerEnabled() })} />
      <PrefSyncServer />
      <div className="flex-1">{children}</div>
      {/* Clears the fixed bottom bar on phones so the footer is not hidden. */}
      <div className="pb-16 md:pb-0">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
