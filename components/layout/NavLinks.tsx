// Owns the primary nav row and its active-link underline.
//
// It deliberately does NOT decide which links to show. Each role's layout
// passes its own set, so student and teacher navigation differ structurally
// rather than by hiding items from a shared list — a hidden link is still a
// link someone can find.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface NavLink {
  href: string;
  label: string;
}

export function NavLinks({
  links,
  className,
}: {
  links: readonly NavLink[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {links.map((link) => {
        // Prefix match so /modules/abc keeps /modules underlined. The equality
        // check handles "/" which would otherwise match everything.
        const active =
          pathname === link.href ||
          (link.href !== "/" && pathname.startsWith(`${link.href}/`));

        return (
          <Link
            key={link.href}
            href={link.href}
            // aria-current is what a screen reader announces. The underline is
            // decoration and says nothing on its own.
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-lg px-3 py-2 font-body text-sm transition-colors",
              active ? "text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
            )}
          >
            {link.label}
            {active ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
