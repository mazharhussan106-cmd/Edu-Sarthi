// Owns the notices card on the student dashboard: upcoming classes, deadlines
// and announcements an admin has posted.
//
// It renders nothing when there are none. An empty "No notices" box on every
// visit is clutter, and the page needs no apology for a quiet week.

import { Card, CardTitle } from "@/components/ui/Card";
import { formatEvent, type NoticeRow } from "@/lib/notices";

export function NoticesCard({ notices }: { notices: readonly NoticeRow[] }) {
  if (notices.length === 0) return null;
  return (
    <Card>
      <CardTitle>Notices</CardTitle>
      <ul className="mt-3 divide-y divide-border">
        {notices.map((n) => (
          <li key={n.id} className="py-2.5 first:pt-0 last:pb-0">
            <p className="text-sm font-medium text-ink">{n.title}</p>
            {n.eventAt ? <p className="text-xs font-semibold text-accent">{formatEvent(n.eventAt)}</p> : null}
            <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
