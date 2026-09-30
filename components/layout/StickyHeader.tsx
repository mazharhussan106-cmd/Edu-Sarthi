// Owns the two-row sticky header and its collapse behaviour.
//
// Row 1 is always pinned. Row 2 shows at the top of the page, collapses on
// scroll, and comes back on hover anywhere over the header. Above 1400px both
// rows merge into one line; below 768px row 2 is gone and MobileMenu carries
// navigation.
//
// It deliberately takes `stats` as a prop rather than fetching. The caller
// passes a SERVER component, which keeps the Prisma queries on the server —
// a client component cannot query, and adding an API route just to feed a
// header is a request per page load for data the page already had.

"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Theme } from "@prisma/client";

import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NavLinks, type NavLink } from "@/components/layout/NavLinks";
import { SettingsMenu } from "@/components/layout/SettingsMenu";

const MERGE_QUERY = "(min-width: 1400px)";
const COLLAPSE_AFTER_PX = 24;

export function StickyHeader({
  links,
  stats,
  theme,
  homeHref,
}: {
  links: readonly NavLink[];
  stats?: ReactNode;
  theme: Theme;
  homeHref: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [merged, setMerged] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    function read() {
      // Which element actually scrolls depends on how h-full on <html>
      // resolves, and it differs between browsers. Reading all three is the
      // only reliable way to get a number.
      const y =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      setScrolled(y > COLLAPSE_AFTER_PX);
      ticking.current = false;
    }

    function onScroll() {
      // Throttled to one read per frame. Scroll fires far faster than the
      // screen repaints, and an unthrottled setState here janks the page.
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(read);
    }

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // matchMedia, not a resize listener: it fires only when the breakpoint is
    // actually crossed, and it catches browser zoom, which resize does not
    // report reliably.
    const mql = window.matchMedia(MERGE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setMerged(e.matches);

    setMerged(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const rowTwoOpen = !scrolled || hovered;

  return (
    <header
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="sticky top-0 z-40 border-b border-border bg-nav-bg backdrop-blur"
    >
      {/* max-w-7xl, one step wider than page content, so the nav breathes
          without the body text running long. */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-14 items-center gap-4">
          <Link
            href={homeHref}
            className="font-display text-lg font-bold text-brand hover:text-accent"
          >
            EduSarthi
          </Link>

          <NavLinks links={links} className="hidden md:flex" />

          {/* Above 1400px the stats slot into row 1 between the nav and the
              actions, and row 2 stops rendering entirely. */}
          {merged && stats ? (
            <div className="ml-auto flex items-center gap-6">{stats}</div>
          ) : (
            <div className="ml-auto" />
          )}

          <div className="flex items-center gap-2">
            <SettingsMenu initialTheme={theme} />
            <MobileMenu links={links} />
          </div>
        </div>

        {!merged && stats ? (
          <div
            // max-height and opacity, never conditional unmounting. Unmounting
            // pops with no animation, and re-mounting re-runs the server
            // queries behind `stats` on every expand.
            className={cn(
              "hidden overflow-hidden transition-all duration-200 md:block",
              rowTwoOpen ? "max-h-16 opacity-100" : "max-h-0 opacity-0",
            )}
            // Hidden from screen readers when collapsed; the transition leaves
            // it in the DOM, and an announced-but-invisible row is confusing.
            aria-hidden={!rowTwoOpen}
          >
            <div className="flex items-center gap-6 border-t border-border py-2.5">
              {stats}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
