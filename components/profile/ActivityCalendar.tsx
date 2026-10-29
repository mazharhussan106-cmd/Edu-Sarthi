// Owns the calendar of squares on a Profile: one square per India day, Monday
// at the top, darker for more activity, today outlined. A phone shows the
// last 17 weeks, a mid-size screen 26 and a computer a full year.
//
// The squares are a picture for sighted users, so they are hidden from screen
// readers; the summary line and "View as list" carry the same facts as text,
// and the list is also the answer for anyone who cannot tell the shades
// apart. It deliberately does NOT count anything; the caller passes one
// entry per active day with its shade score and words.

import type { ReactNode } from "react";

import { Card, CardTitle } from "@/components/ui/Card";
import { SheetButton } from "@/components/ui/SheetButton";
import { cn } from "@/lib/utils";

export type CalendarDay = { day: number; score: number; text: string };

const WEEKS = 53;
const DAY_MS = 86_400_000;
const SHADES = ["bg-paper-dim", "bg-accent/25", "bg-accent/50", "bg-accent/75", "bg-accent"];

// Day 0 (1 Jan 1970) was a Thursday; Monday is 0 here.
const weekday = (day: number) => (day + 3) % 7;
const dateOf = (day: number) => new Date(day * DAY_MS);
const fmt = (day: number, o: Intl.DateTimeFormatOptions) => dateOf(day).toLocaleDateString("en-IN", { ...o, timeZone: "UTC" });

export function ActivityCalendar({
  title,
  days,
  today,
  levels,
  summary,
  note,
  legend = ["Less", "More"],
  emptyText,
}: {
  title: string;
  days: CalendarDay[];
  today: number;
  /** Score at which each darker shade starts, e.g. [1, 10, 25, 50]. */
  levels: [number, number, number, number];
  summary: ReactNode;
  note?: string;
  legend?: [string, string];
  emptyText: string;
}) {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const shade = (score: number) => (score >= levels[3] ? 4 : score >= levels[2] ? 3 : score >= levels[1] ? 2 : score >= levels[0] ? 1 : 0);
  const firstMonday = today - weekday(today) - (WEEKS - 1) * 7;
  const listed = [...days].filter((d) => d.day >= firstMonday && d.day <= today).sort((a, b) => b.day - a.day);

  return (
    <Card className="p-4 sm:p-5 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <SheetButton title={title} done label="View as list" className="rounded-md text-sm font-medium text-accent-dark hover:underline">
          {listed.length === 0 ? (
            <p className="text-sm text-ink-muted">{emptyText}</p>
          ) : (
            <ul className="divide-y divide-border">
              {listed.map((d) => (
                <li key={d.day} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="text-ink">{fmt(d.day, { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span className="text-right text-ink-muted">{d.text}</span>
                </li>
              ))}
            </ul>
          )}
        </SheetButton>
      </div>

      <div aria-hidden="true" className="mt-3 flex gap-1.5">
        <div className="grid grid-rows-[14px_repeat(7,13px)] gap-[3px] text-[9px] leading-[13px] text-ink-muted">
          <span />
          {["Mon", "", "Wed", "", "Fri", "", ""].map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {Array.from({ length: WEEKS }, (_, w) => {
            const start = firstMonday + w * 7;
            const fromEnd = WEEKS - 1 - w;
            // A month's name sits over the week its 1st falls in.
            const firstOfMonth = Array.from({ length: 7 }, (_, i) => start + i).find((d) => dateOf(d).getUTCDate() === 1);
            return (
              <div key={w} className={cn("grid grid-rows-[14px_repeat(7,13px)] gap-[3px]", fromEnd >= 26 ? "hidden lg:grid" : fromEnd >= 17 ? "hidden md:grid" : "")}>
                <span className="w-[13px] overflow-visible whitespace-nowrap text-[9px] leading-[14px] text-ink-muted">
                  {firstOfMonth !== undefined && fromEnd < 52 ? fmt(firstOfMonth, { month: "short" }) : ""}
                </span>
                {Array.from({ length: 7 }, (_, i) => {
                  const day = start + i;
                  if (day > today) return <span key={i} />;
                  const entry = byDay.get(day);
                  return (
                    <span
                      key={i}
                      title={`${fmt(day, { day: "numeric", month: "short" })}: ${entry?.text ?? "nothing"}`}
                      className={cn(
                        "h-[13px] w-[13px] rounded-[3px] outline -outline-offset-1",
                        SHADES[shade(entry?.score ?? 0)],
                        day === today ? "outline-2 outline-ink" : "outline-1 outline-border",
                      )}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-ink">{summary}</p>
        <p aria-hidden="true" className="flex items-center gap-1 text-[11px] text-ink-muted">
          {legend[0]}
          {SHADES.map((s) => (
            <span key={s} className={cn("h-[11px] w-[11px] rounded-[3px] outline outline-1 -outline-offset-1 outline-border", s)} />
          ))}
          {legend[1]}
        </p>
      </div>
      {note ? <p className="mt-2 text-xs text-ink-muted">{note}</p> : null}
    </Card>
  );
}
