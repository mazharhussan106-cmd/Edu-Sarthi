// Owns the score trend chart on the student dashboard.
//
// A client component because recharts measures the DOM to size itself. The
// page that renders it stays on the server and passes plain numbers, so the
// database work never crosses the boundary.
//
// It deliberately plots the five-criterion average rather than five lines. Five
// overlapping lines on a phone is noise; the per-criterion detail lives on the
// audit itself, where there is room for it.

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendPoint = { label: string; average: number };

export function ScoreTrend({ data }: { data: readonly TrendPoint[] }) {
  // Two points is the minimum that shows a direction. One dot on an axis tells
  // a student nothing they did not already know from the audit.
  if (data.length < 2) {
    return (
      <p className="text-sm text-ink-muted">
        Once you have two audits back, your trend will appear here.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          {/* Colours come from the CSS variables, so the chart follows the
              active theme instead of being drawn in a fixed palette that
              disappears on the dark themes. */}
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            stroke="var(--color-ink-muted)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            stroke="var(--color-ink-muted)"
            fontSize={11}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-ink)",
            }}
            // recharts types this value loosely because a chart can hold
            // strings, arrays or nulls. Coerced rather than cast, so a bad
            // point renders as a dash instead of throwing inside the tooltip.
            formatter={(value) => {
              const n = Number(value);
              return [Number.isFinite(n) ? `${n.toFixed(1)} / 10` : "—", "Average"];
            }}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-accent)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
