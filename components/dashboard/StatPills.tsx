// Owns the two pills beside the dashboard greeting, the streak and the XP with
// its stage, and the sheets they open (the same Sheet as Settings).
//
// A client component only because a sheet opens and closes. What the sheets
// say is rendered on the server (StreakSheet, XpSheet) and passed in as
// children, so no numbers are re-fetched or re-computed in the browser.

"use client";

import { Flame, Star } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sheet } from "@/components/ui/Sheet";

type Which = "streak" | "xp" | null;

const pill = "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-semibold text-ink hover:bg-hover";

export function StatPills({
  streak,
  xp,
  stage,
  streakSheet,
  xpSheet,
}: {
  streak: number;
  xp: number;
  stage: number;
  streakSheet: ReactNode;
  xpSheet: ReactNode;
}) {
  const [open, setOpen] = useState<Which>(null);
  const close = () => setOpen(null);

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" aria-haspopup="dialog" className={pill} onClick={() => setOpen("streak")}>
        <Flame aria-hidden="true" className="h-4 w-4 text-saffron" />
        {streak} <span className="font-medium text-ink-muted">day{streak === 1 ? "" : "s"}<span className="sr-only"> streak, see the month</span></span>
      </button>
      <button type="button" aria-haspopup="dialog" className={pill} onClick={() => setOpen("xp")}>
        <Star aria-hidden="true" className="h-4 w-4 text-accent" />
        {xp.toLocaleString("en-IN")} <span className="font-medium text-ink-muted">XP · Stage {stage}<span className="sr-only">, see how XP is earned</span></span>
      </button>

      <Sheet open={open === "streak"} onClose={close} title={streak > 0 ? `${streak}-day streak` : "Your streak"} done>
        {streakSheet}
      </Sheet>
      <Sheet open={open === "xp"} onClose={close} title={`Stage ${stage} · ${xp.toLocaleString("en-IN")} XP`} done>
        {xpSheet}
      </Sheet>
    </div>
  );
}
