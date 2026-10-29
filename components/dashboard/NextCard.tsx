// Owns the "do this next" card on the student dashboard: one suggestion, one
// button. The choice itself is made in lib/dashboardNext; this only draws it.
//
// The whole card is the link, so a thumb anywhere on it works on a phone.

import Link from "next/link";

import type { NextAction } from "@/lib/dashboardNext";

export function NextCard({ next }: { next: NextAction }) {
  return (
    <Link
      href={next.href}
      className="flex flex-col gap-1 rounded-xl bg-accent/12 p-4 transition-colors hover:bg-accent/20 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-dark">{next.eyebrow}</span>
        <span className="font-display text-lg font-bold text-ink">{next.title}</span>
        {/* text-ink, not muted: muted grey on the accent tint is 4.46:1 in the
            light theme, short of 4.5:1. */}
        <span className="text-sm text-ink">{next.body}</span>
      </span>
      <span className="mt-2 inline-flex min-h-11 w-fit shrink-0 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent sm:mt-0">
        {next.cta}
      </span>
    </Link>
  );
}
