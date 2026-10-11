// Owns the seven-day activity bars: recordings sent and cards reviewed.
//
// Plain CSS bars rather than a chart library: seven small numbers need no
// axes, it renders on the server, and it costs a slow phone no extra script.
// Each day also gets a text count, so the chart is readable without colour.

import type { ActivityDay } from "@/lib/studentStats";

export function WeeklyActivity({ days }: { days: readonly ActivityDay[] }) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.recordings * 10, d.cards)));
  const total = days.reduce((n, d) => n + d.recordings + d.cards, 0);

  if (total === 0) {
    return <p className="text-sm text-ink-muted">Nothing yet this week. Review a few cards or send a recording and the bars appear here.</p>;
  }

  return (
    <div>
      <ul className="flex h-28 items-end gap-2" aria-label="Activity in the last seven days">
        {days.map((d) => (
          <li key={d.label} className="flex flex-1 flex-col items-center gap-1" aria-label={`${d.label}: ${d.recordings} recordings, ${d.cards} cards`}>
            <div className="flex h-20 w-full items-end justify-center gap-0.5">
              {/* A recording is worth ten cards of bar height; otherwise one
                  recording would vanish next to thirty cards. */}
              <div className="w-1/2 rounded-t bg-tag-teal" style={{ height: `${(d.cards / max) * 100}%` }} />
              <div className="w-1/2 rounded-t bg-accent" style={{ height: `${((d.recordings * 10) / max) * 100}%` }} />
            </div>
            <span className="text-[10px] text-ink-muted">{d.label}</span>
            <span className="font-mono text-[10px] text-ink">{d.cards}·{d.recordings}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">
        <span className="text-tag-teal">■</span> cards reviewed · <span className="text-accent">■</span> recordings sent (shown as cards·recordings)
      </p>
    </div>
  );
}
