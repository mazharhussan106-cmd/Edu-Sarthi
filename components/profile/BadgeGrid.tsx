// Owns the Badges card: earned badges first as coloured circles, then the next
// ones still to earn in grey, and a "See all" sheet that lists every badge
// with what to do to earn it.
//
// The hint sits in the sheet, not in a hover title: a phone has no hover, and
// a tooltip is not reachable by keyboard or screen reader. It deliberately
// does NOT decide who earned what; lib/badges does.

import { Award, BookOpen, Check, Flame, Layers, Mic, Sparkles, Trophy, type LucideIcon } from "lucide-react";

import { Card, CardTitle } from "@/components/ui/Card";
import { SheetButton } from "@/components/ui/SheetButton";
import type { Badge } from "@/lib/badges";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "first-recording": Mic,
  "first-audit": Check,
  "five-audits": Award,
  "streak-3": Flame,
  "streak-7": Flame,
  "streak-14": Trophy,
  "known-30": Layers,
  "known-100": Layers,
  "deck-maker": BookOpen,
};

function Medal({ badge, small = false }: { badge: Badge; small?: boolean }) {
  const Icon = ICONS[badge.id] ?? Sparkles;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2",
        small ? "h-9 w-9" : "h-12 w-12",
        badge.earned ? "border-accent bg-accent/12 text-accent-dark" : "border-dashed border-border-strong bg-paper-dim text-ink-muted",
      )}
    >
      <Icon className={small ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}

export function BadgeGrid({ badges, show = 8 }: { badges: Badge[]; show?: number }) {
  const earned = badges.filter((b) => b.earned);
  const shown = [...earned, ...badges.filter((b) => !b.earned)].slice(0, show);
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Badges</CardTitle>
        <span className="text-xs text-ink-muted">
          {earned.length} of {badges.length}
        </span>
      </div>
      <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4">
        {shown.map((b) => (
          <li key={b.id} className="flex flex-col items-center gap-1.5 text-center">
            <Medal badge={b} />
            <span className={cn("text-[11px] leading-tight", b.earned ? "text-ink" : "text-ink-muted")}>
              {b.label}
              <span className="sr-only">{b.earned ? ", earned" : ", not earned yet"}</span>
            </span>
          </li>
        ))}
      </ul>
      <SheetButton
        title="Badges"
        done
        label={earned.length === badges.length ? `See all ${badges.length}` : `How to earn them · see all ${badges.length}`}
        className="mt-4 rounded-md text-sm font-medium text-accent-dark hover:underline"
      >
        <ul className="divide-y divide-border">
          {badges.map((b) => (
            <li key={b.id} className="flex items-center gap-3 py-2.5">
              <Medal badge={b} small />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{b.label}</span>
                <span className="block text-xs text-ink-muted">{b.earned ? "Earned" : b.hint}</span>
              </span>
            </li>
          ))}
        </ul>
      </SheetButton>
    </Card>
  );
}
