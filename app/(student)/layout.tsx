// Owns the shell for every student page: header with student navigation, and
// the footer.
//
// It deliberately does NOT check the role. Middleware already did, before the
// page started rendering — repeating it here would be a second place to
// forget when a route is added.

import { cookies } from "next/headers";

import { ensureActiveUser } from "@/lib/activeUser";

import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { STUDENT_LINKS } from "@/lib/studentNav";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await ensureActiveUser();
  const cookieStore = await cookies();
  const theme = themeFromCookie(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="flex min-h-screen flex-col">
      {/* No `stats` yet. Row 2 stays unrendered until the progress strip
          exists in Phase 6 — an empty bar is worse than no bar. */}
      <StickyHeader links={STUDENT_LINKS} theme={theme} homeHref="/dashboard" search={<HeaderSearch />} />
      <div className="flex-1">{children}</div>
      {/* Clears the fixed bottom bar on phones so the footer is not hidden. */}
      <div className="pb-16 md:pb-0">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
