// Owns the shell for every admin page: the staff header with admin links.
//
// It deliberately does NOT check the role. Middleware keeps non-admins out of
// /admin, and every admin API route re-checks against the database.

import { cookies } from "next/headers";

import { ensureActiveUser } from "@/lib/activeUser";
import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { ADMIN_LINKS } from "@/lib/staffNav";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await ensureActiveUser(["ADMIN"]);
  const cookieStore = await cookies();
  const theme = themeFromCookie(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader links={ADMIN_LINKS} theme={theme} homeHref="/admin" />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
