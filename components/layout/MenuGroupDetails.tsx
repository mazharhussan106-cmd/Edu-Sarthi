// Owns one folding group in the menu sheet: its icon and heading, how many
// links it holds and a chevron; a tap on the heading shows or hides the links,
// one per line, or as rows of chips for a group that has `chipRows`.
//
// Native <details>: open/close, keyboard and screen reader support come free,
// with no script. Every group starts closed (owner's choice, 28 Oct), and the
// sheet unmounts when it closes, so it always reopens with every group closed.
//
// It deliberately does NOT decide which groups exist or close the sheet itself;
// MobileMenu passes the groups and the close handler.

import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MenuGroup } from "@/lib/studentNav";

export function MenuGroupDetails({
  group,
  pathname,
  onNavigate,
  matchPrefix = false,
  className,
}: {
  group: MenuGroup;
  pathname: string;
  onNavigate: () => void;
  /** Light a link on its sub-pages too (/flashcards/sections lights Flashcard).
      Only for the main pages: in other groups two links can share a path. */
  matchPrefix?: boolean;
  className?: string;
}) {
  return (
    <details className={cn("group py-1", className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 font-body text-sm font-medium text-ink marker:hidden hover:bg-hover [&::-webkit-details-marker]:hidden">
        <span>
          <span aria-hidden="true" className="mr-2">{group.icon}</span>
          {group.heading}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span aria-hidden="true" className="font-mono">{group.items.length}</span>
          <span className="sr-only">{group.items.length} links</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      {group.chipRows ? (
        <div className="mt-1 flex flex-col gap-2 pb-2 pl-3">
          {group.chipRows.map((row, i) => (
            // One row of chips, never wrapped: on a phone a long row scrolls
            // sideways like the My cards page; on a computer the sheet is wide
            // enough for every row (MobileMenu).
            <div key={i} className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {row.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={onNavigate}
                  className="flex min-h-10 shrink-0 items-center gap-1 rounded-full border border-border-strong px-2.5 font-body text-[13px] font-medium text-ink hover:bg-hover"
                >
                  {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1 flex flex-col gap-1 pb-1 pl-3">
          {group.items.map((item) => {
            const active = pathname === item.href || (matchPrefix && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                // No prefetch: opening the sheet would fetch some 25 pages on a
                // phone's data. And each of those responses re-sets the session
                // cookie, so one still in flight after Sign out signed the person
                // straight back in.
                prefetch={false}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-lg px-3 font-body text-sm",
                  // accent-dark: plain accent on its own 12% tint is about
                  // 4.2:1 in the light theme, short of the 4.5:1 text needs.
                  active ? "bg-accent/12 font-medium text-accent-dark" : "text-ink-muted hover:bg-hover hover:text-ink",
                )}
              >
                {item.icon ? <span aria-hidden="true" className="mr-2">{item.icon}</span> : null}
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </details>
  );
}
