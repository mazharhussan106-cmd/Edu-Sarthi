// Owns the small progress strip on the student's audit: which audit this is,
// and the overall score of up to the last five, oldest to newest, ending with
// this one.
//
// It deliberately draws a plain inline SVG rather than using the dashboard's
// recharts chart: five points do not need a chart library on a slow phone,
// and the numbers are also written out, so the line is decoration, not the
// only way to read it. The full trend lives on the dashboard and Progress.

import { Card, CardTitle } from "@/components/ui/Card";

export function AuditProgress({ number, scores }: { number: number; scores: readonly number[] }) {
  if (scores.length < 2) {
    return (
      <Card className="p-4 sm:p-6">
        <CardTitle>Your progress</CardTitle>
        <p className="mt-2 text-sm text-ink-muted">
          This is your first audit. From the next one, this shows how your overall score moves.
        </p>
      </Card>
    );
  }

  // 0-10 maps onto a 100×30 box stretched to the card's width; the padding
  // keeps the dots inside it.
  const x = (i: number) => 4 + (i * 92) / (scores.length - 1);
  const y = (v: number) => 27 - (v / 10) * 24;
  const points = scores.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>Your progress</CardTitle>
        <span className="text-xs text-ink-muted">Audit {number}</span>
      </div>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-3 h-12 w-full text-accent" aria-hidden="true">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {scores.map((v, i) => (
          // A zero-length stroke with round caps, not a <circle>: the box is
          // stretched, which would squash a circle into an ellipse, while a
          // non-scaling stroke stays round.
          <path
            key={i}
            d={`M${x(i)} ${y(v)}h0`}
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth={i === scores.length - 1 ? 9 : 6}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <p className="mt-2 font-mono text-sm text-ink">
        <span className="sr-only">Overall score over your last {scores.length} audits: </span>
        {scores.map((v) => v.toFixed(1)).join(" → ")}
      </p>
      <p className="mt-1 text-xs text-ink-muted">Overall score, last {scores.length} audits, ending with this one.</p>
    </Card>
  );
}
