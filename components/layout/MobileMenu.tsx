// Owns navigation below 768px, where the second header row is hidden entirely
// and the hamburger carries everything.
//
// It deliberately duplicates the link list rather than reusing NavLinks. The
// desktop nav is a horizontal row with an underline; this is a vertical sheet
// with tap targets. Forcing one component to be both means a pile of
// conditional classes that neither layout owns.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { InstallApp } from "@/components/layout/InstallApp";
import type { NavLink } from "@/components/layout/NavLinks";
import type { MenuGroup } from "@/lib/studentNav";

export function MobileMenu({ links, more }: { links: readonly NavLink[]; more?: readonly MenuGroup[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Closing on navigation is not automatic: Next keeps the component mounted
  // across a route change, so the sheet would stay open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Scroll lock while open, or the page behind scrolls under the sheet on iOS
  // and the user loses their place.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    // With extra menu groups the button stays on desktop too; without them it
    // is the phone-only navigation sheet it always was.
    <div className={more ? "" : "md:hidden"}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-hover"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col border-l border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-display text-base font-bold text-ink">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-hover"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 overflow-y-auto p-3">
              {/* The five main destinations are already in the header row on
                  desktop, so the sheet repeats them on phones only. */}
              <div className={cn("flex flex-col gap-1", more && "md:hidden")}>
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(`${link.href}/`));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      // min-h-12, not py-2: 48px is the smallest tap target
                      // that works reliably on a phone.
                      "flex min-h-12 items-center rounded-lg px-3 font-body text-sm",
                      active
                        ? "bg-accent/12 font-medium text-accent"
                        : "text-ink-muted hover:bg-hover hover:text-ink",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              </div>
              {more?.map((g) => (
                <div key={g.heading} className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{g.heading}</p>
                  {g.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center rounded-lg px-3 font-body text-sm",
                        pathname === item.href ? "bg-accent/12 font-medium text-accent" : "text-ink-muted hover:bg-hover hover:text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
              {more ? <InstallApp /> : null}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
