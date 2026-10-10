// Owns the "today's work" row on the dashboard: three counts that answer "what
// is waiting for me", each linking to where it is done.
//
// It takes numbers, not queries; the dashboard already has every one of them.

import Link from "next/link";

import { Card } from "@/components/ui/Card";

export function TodayWork({ due, newLeft, redo }: { due: number; newLeft: number; redo: number }) {
  const items = [
    { n: due, label: "cards due", href: "/flashcards" },
    { n: newLeft, label: "new cards today", href: "/flashcards" },
    { n: redo, label: "to re-record", href: "/feedback" },
  ];
  return (
    <div className="mt-3 grid grid-cols-3 gap-3" role="list" aria-label="Today's work">
      {items.map((i) => (
        <Link key={i.label} href={i.href} role="listitem">
          <Card className="p-3 transition-colors hover:bg-hover">
            <p className="font-mono text-2xl font-bold text-ink">{i.n}</p>
            <p className="text-xs text-ink-muted">{i.label}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
