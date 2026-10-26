// Owns the list of card answers, grouped under a heading per day. Shared by the
// student's History page and the teacher and admin views.
//
// It does not fetch and does not decide who may see a card's text: `cardText`
// arrives null when the viewer may not read it, and the row then says only
// "A card from a private deck".

import { Badge } from "@/components/ui/Badge";
import type { StudyItem } from "@/lib/history";

const RECALL_LABEL = { HARD: "Hard", MEDIUM: "Medium", EASY: "Easy" } as const;

const dayLabel = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const time = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function StudyList({ items }: { items: StudyItem[] }) {
  const groups: { label: string; rows: StudyItem[] }[] = [];
  for (const it of items) {
    const label = dayLabel(it.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(it);
    else groups.push({ label, rows: [it] });
  }
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <section key={g.label} aria-label={g.label}>
          <h3 className="text-xs font-medium uppercase tracking-wider text-ink-muted">{g.label}</h3>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface">
            {g.rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{r.cardText ?? "A card from a private deck"}</p>
                  <p className="text-xs text-ink-muted">
                    {time(r.createdAt)}
                    {r.recall ? ` · ${RECALL_LABEL[r.recall]}` : ""}
                  </p>
                </div>
                <Badge variant={r.known ? "success" : "neutral"}>{r.known ? "Known" : "Unknown"}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
