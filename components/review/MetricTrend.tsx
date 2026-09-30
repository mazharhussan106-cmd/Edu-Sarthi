// Owns the teacher's five-line score chart on the student dossier: one line
// per rubric criterion, audit by audit.
//
// Five lines are fine here and wrong on the student dashboard: this is a wide
// desktop screen, and the teacher's question is which skill is lagging, not
// whether the overall number moved.
//
// Lines differ by dash pattern as well as colour, so they stay apart for
// colour-blind readers and in the high-contrast theme.

"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MetricPoint = {
  label: string;
  pronunciation: number;
  grammar: number;
  fluency: number;
  vocabulary: number;
  confidence: number;
};

const SERIES = [
  { key: "pronunciation", name: "Pronunciation", color: "var(--color-accent)", dash: undefined },
  { key: "grammar", name: "Grammar", color: "var(--color-success)", dash: "6 3" },
  { key: "fluency", name: "Fluency", color: "var(--color-error)", dash: "2 3" },
  { key: "vocabulary", name: "Vocabulary", color: "var(--color-ink)", dash: "8 3 2 3" },
  { key: "confidence", name: "Confidence", color: "var(--color-ink-muted)", dash: "1 2" },
] as const;

export function MetricTrend({ data }: { data: readonly MetricPoint[] }) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-ink-muted">
        The trend appears once this student has two audits in the selected range.
      </p>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="var(--color-ink-muted)" fontSize={11} tickLine={false} />
          <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="var(--color-ink-muted)" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-ink)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-ink-muted)" }} />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dash}
              dot={{ r: 2.5, fill: s.color }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
