// Owns the shell for every admin page: the staff header with admin links.
//
// It deliberately does NOT check the role. Middleware keeps non-admins out of
// /admin, and every admin API route re-checks against the database.

import { ensureActiveUser } from "@/lib/activeUser";
import { Footer } from "@/components/layout/Footer";
import { NotificationBellServer } from "@/components/layout/NotificationBellServer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { ADMIN_LINKS } from "@/lib/staffNav";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await ensureActiveUser(["ADMIN"]);

  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader links={ADMIN_LINKS} homeHref="/admin" bell={<NotificationBellServer />} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
