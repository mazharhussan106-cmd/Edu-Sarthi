// Owns the shell for every student page: header with student navigation, and
// the footer.
//
// It deliberately does NOT check the role. Middleware already did, before the
// page started rendering — repeating it here would be a second place to
// forget when a route is added.

import { cookies } from "next/headers";

import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import type { NavLink } from "@/components/layout/NavLinks";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";

const STUDENT_LINKS: readonly NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/modules", label: "Modules" },
  { href: "/feedback", label: "Feedback" },
];

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = themeFromCookie(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="flex min-h-screen flex-col">
      {/* No `stats` yet. Row 2 stays unrendered until the progress strip
          exists in Phase 6 — an empty bar is worse than no bar. */}
      <StickyHeader links={STUDENT_LINKS} theme={theme} homeHref="/dashboard" />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
