// Owns the list of a student's recordings and their audits, one row each. The
// student's History page, the teacher dossier and the admin view all render it,
// so a recording looks the same to everyone who may see it.
//
// It does not fetch anything and does not decide who may look: callers pass
// rows they were already allowed to read. `hrefBase` is null where the viewer
// has no page to open an audit on (the link is then left out, not broken).

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RETURN_REASON_LABEL, STATUS_BADGE } from "@/lib/audits";
import type { PracticeItem } from "@/lib/history";

const when = (d: Date) =>
  d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function PracticeList({ items, hrefBase }: { items: PracticeItem[]; hrefBase: string | null }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((s) => {
        const badge = STATUS_BADGE[s.status];
        const body = (
          <Card className="p-4 transition-colors hover:border-border-strong">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-ink">{s.cardText ? `Card: ${s.cardText}` : s.title}</p>
                <p className="mt-1 text-xs text-ink-muted">{when(s.createdAt)}</p>
                {s.returnReason ? <p className="mt-1 text-xs text-ink-muted">Sent back: {RETURN_REASON_LABEL[s.returnReason]}</p> : null}
                {/* The audit stays after the recording is deleted; say so, or the missing player looks like a bug. */}
                {s.mediaPurged ? <p className="mt-1 text-xs text-ink-muted">The recording was deleted after the storage period. The audit is kept.</p> : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge variant={badge.variant}>{badge.text}</Badge>
                {s.average !== null ? (
                  <span className="font-mono text-sm font-bold text-ink">
                    {s.average.toFixed(1)}
                    <span className="text-xs font-normal text-ink-muted">/10</span>
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        );
        return (
          <li key={s.id}>
            {hrefBase ? (
              <Link href={`${hrefBase}/${s.id}`} className="block">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
