// Owns the Notices page: every notice that is still current — upcoming
// classes, deadlines, and the dashboard line of an announcement an admin sent.
//
// The dashboard shows the first five and nothing when there are none; this
// page is where the menu's "Notices" link lands, so it always says something,
// even in a quiet week. It deliberately keeps no "read" state: a notice is for
// everyone and disappears on its own when it expires (lib/notices).

import { activeNotices } from "@/lib/notices";
import { Card } from "@/components/ui/Card";
import { NoticesCard } from "@/components/dashboard/NoticesCard";

export const revalidate = 0;

export default async function NoticesPage() {
  // activeNotices reads at most 20 rows; more than that at once has not happened.
  const notices = await activeNotices(20);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Notices</h1>
      <p className="mt-1 text-sm text-ink-muted">Classes, deadlines and announcements from EduSarthi. Upcoming events come first.</p>

      <div className="mt-6">
        {notices.length ? (
          <NoticesCard notices={notices} title="Now and coming up" />
        ) : (
          <Card className="text-sm text-ink-muted">
            No notices right now. Upcoming classes, deadlines and announcements will show here and on your dashboard.
          </Card>
        )}
      </div>
    </main>
  );
}
