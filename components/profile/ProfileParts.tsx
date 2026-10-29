// Owns the small building blocks every Profile shares: a group of rows under a
// heading, a row that links somewhere, a row that only shows a fact, the row
// icon, and the strip of number tiles.
//
// Rows match the Settings rows (name on one line, at most two lines under it),
// with an icon in front because Profile rows go to other places. It
// deliberately does NOT fetch anything or know about roles.

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function RowGroup({ id, title, children, className }: { id: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={`${id}-h`} id={id} className={cn("scroll-mt-20", className)}>
      <h2 id={`${id}-h`} className="px-1 font-display text-xs font-bold uppercase tracking-wider text-ink-muted">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface px-4">{children}</div>
    </section>
  );
}

export function RowIcon({ icon: Icon, danger = false }: { icon: LucideIcon; danger?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-dim", danger ? "text-error" : "text-ink-light")}>
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

function RowText({ title, subline }: { title: string; subline?: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium text-ink">{title}</span>
      {subline ? <span className="mt-0.5 line-clamp-2 block text-xs text-ink-muted">{subline}</span> : null}
    </span>
  );
}

export function LinkRow({
  href,
  icon,
  title,
  subline,
  value,
  plain = false,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subline?: string;
  value?: string;
  /** A plain <a>: for a file download, which must not go through the router. */
  plain?: boolean;
}) {
  const body = (
    <>
      <RowIcon icon={icon} />
      <RowText title={title} subline={subline} />
      {value ? <span className="shrink-0 text-sm text-ink-muted">{value}</span> : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
    </>
  );
  const cls = "-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-hover";
  return plain ? (
    <a href={href} className={cls}>{body}</a>
  ) : (
    <Link href={href} className={cls}>{body}</Link>
  );
}

/// A Settings-style row that opens a sheet, with the Profile row icon in front.
export function IconSlot({ icon, danger, children }: { icon: LucideIcon; danger?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <RowIcon icon={icon} danger={danger} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function InfoRow({ icon, title, subline }: { icon: LucideIcon; title: string; subline?: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <RowIcon icon={icon} />
      <RowText title={title} subline={subline} />
    </div>
  );
}

export type Tile = { icon?: LucideIcon; value: string | number; label: string; highlight?: boolean };

export function StatTiles({ tiles, label }: { tiles: Tile[]; label: string }) {
  return (
    <section aria-label={label}>
      <ul className="grid grid-cols-2 gap-2 sm:gap-3">
        {tiles.map(({ icon: Icon, value, label: name, highlight }) => (
          <li key={name} className={cn("rounded-xl border bg-surface px-3 py-3", highlight ? "border-saffron" : "border-border")}>
            <p className="flex items-center gap-1.5 font-mono text-2xl font-bold text-ink">
              {Icon ? <Icon className="h-4 w-4 shrink-0 text-accent-dark" aria-hidden="true" /> : null}
              {value}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">{name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
