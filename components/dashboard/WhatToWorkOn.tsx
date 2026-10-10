// Owns the "what to work on" card: names the student's weakest rubric score,
// or invites a first recording when there is no audit to learn from yet.

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";

export function WhatToWorkOn({ weakest }: { weakest: { label: string; mean: number } | null }) {
  return (
  <Card>
    <CardTitle>What to work on</CardTitle>
    {weakest ? (
      <>
        <p className="mt-2 text-sm text-ink-muted">
          Across your audits, {weakest.label.toLowerCase()} is your
          lowest score at {weakest.mean.toFixed(1)} out of 10. That is
          the one worth practising next.
        </p>
        <Link href="/modules" className="mt-4 inline-block">
          <Button size="sm">Pick an exercise</Button>
        </Link>
      </>
    ) : (
      <>
        <p className="mt-2 text-sm text-ink-muted">
          Send your first recording and a teacher will tell you exactly
          what to work on.
        </p>
        <Link href="/modules" className="mt-4 inline-block">
          <Button size="sm">Browse modules</Button>
        </Link>
      </>
    )}
  </Card>
  );
}
