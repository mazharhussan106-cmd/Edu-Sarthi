// Owns one Settings row that opens a sheet: the name on one line, a short line
// under it (two lines at most), the current value and a chevron, and the
// sheet with the full setting inside.
//
// Every row is the same height as a toggle row (components/ui/Switch), which
// is what keeps the Settings page calm: anything long lives in the sheet.
//
// "anchor" makes a link such as /settings#share land on the row and open its
// sheet: on load, and when the hash changes on the open page. A Next <Link>
// to a hash on the same page changes it without a hashchange event, so that
// one only scrolls to the row, which is one tap from its sheet.

"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Sheet } from "@/components/ui/Sheet";

export function SheetRow({
  title,
  subline,
  value,
  anchor,
  done = false,
  children,
}: {
  title: string;
  subline?: string;
  /** The current choice, shown before the chevron, e.g. "Dark". */
  value?: string;
  anchor?: string;
  done?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!anchor) return;
    const onHash = () => {
      if (window.location.hash === `#${anchor}`) setOpen(true);
    };
    // Checked once here as well as on every change: a hash that changed while
    // the page was still hydrating fired its event before anyone listened.
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [anchor]);

  return (
    <div id={anchor} className="scroll-mt-20">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-hover"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{title}</span>
          {subline ? <span className="mt-0.5 line-clamp-2 block text-xs text-ink-muted">{subline}</span> : null}
        </span>
        {value ? <span className="max-w-[40%] shrink-0 truncate text-sm text-ink-muted">{value}</span> : null}
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title} done={done}>
        {children}
      </Sheet>
    </div>
  );
}
