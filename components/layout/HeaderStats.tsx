// Owns the streak and XP shown in the header on every student page (row 2 on
// a computer; phones have no room, and the dashboard shows them there). Each
// links to the dashboard, where they open the streak and XP sheets.
//
// A client component that asks /api/progress after every page change: the
// header lives in a layout, which Next does not re-render on client
// navigation, so numbers read on the server would stay as they were when the
// student arrived. It asks only where it shows: not on the dashboard (which
// has the same two pills beside the greeting) and not below the computer
// breakpoint (no header row there), since each ask reads the whole XP
// history. Shows nothing while loading or if the request fails, rather than a
// wrong number.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Star } from "lucide-react";
import { useEffect, useState } from "react";

type Stats = { streak: number; xp: number; stage: number };

// Tailwind's md breakpoint, where the header's second row appears.
const WIDE = "(min-width: 768px)";

export function HeaderStats() {
  const pathname = usePathname();
  const [stats, setStats] = useState<Stats | null>(null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(WIDE);
    const update = () => setWide(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!wide || pathname === "/dashboard") return;
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        if (!res.ok) return;
        const data = JSON.parse(await res.text()) as Partial<Stats>;
        if (live && typeof data.streak === "number" && typeof data.xp === "number" && typeof data.stage === "number") {
          setStats({ streak: data.streak, xp: data.xp, stage: data.stage });
        }
      } catch {
        // A header number is never worth an error message; it simply stays away.
      }
    })();
    return () => {
      live = false;
    };
  }, [pathname, wide]);

  if (!stats || !wide || pathname === "/dashboard") return null;
  const pill = "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-ink hover:bg-hover";
  return (
    <>
      <Link href="/dashboard" className={pill}>
        <Flame aria-hidden="true" className="h-4 w-4 text-saffron" />
        {stats.streak} <span className="font-medium text-ink-muted">day{stats.streak === 1 ? "" : "s"}<span className="sr-only"> streak</span></span>
      </Link>
      <Link href="/dashboard" className={pill}>
        <Star aria-hidden="true" className="h-4 w-4 text-accent" />
        {stats.xp.toLocaleString("en-IN")} <span className="font-medium text-ink-muted">XP · Stage {stats.stage}</span>
      </Link>
    </>
  );
}
