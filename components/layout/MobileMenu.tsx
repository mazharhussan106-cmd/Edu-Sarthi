// Owns navigation below 768px, where the second header row is hidden entirely
// and the hamburger carries everything.
//
// It deliberately duplicates the link list rather than reusing NavLinks. The
// desktop nav is a horizontal row with an underline; this is a vertical sheet
// with tap targets. Forcing one component to be both means a pile of
// conditional classes that neither layout owns.
//
// The open sheet is portalled to <body>. The header it sits in has
// backdrop-blur, and an element with a backdrop-filter becomes the containing
// block for its `position: fixed` children: rendered in place, the "full
// screen" sheet was squeezed into the 56px header and showed only its title.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  // Links close the sheet on tap as well. Some only change the query or hash
  // (/my-cards → /my-cards?list=unknown, /settings#share), so the path never
  // changes and the effect above never fires; and without prefetch the new
  // page takes a moment, which an open sheet would hide.
  const close = () => setOpen(false);

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

      {/* Only ever rendered after a tap, so `document` always exists here. */}
      {open ? createPortal(
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
                    prefetch={false}
                    onClick={close}
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
              {/* Every group starts closed (owner's choice, 28 Oct): the sheet
                  shows six headings instead of ~25 links, and a tap opens the
                  one wanted. Native <details>: open/close, keyboard and screen
                  reader support come free. The sheet unmounts when it closes,
                  so it always reopens with every group closed. */}
              {more?.map((g) => (
                // On a computer the five main links above are hidden (they are in
                // the header), so the first group needs no divider above it.
                <details key={g.heading} className="group mt-2 border-t border-border pt-2 md:first-of-type:mt-0 md:first-of-type:border-t-0 md:first-of-type:pt-0">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 font-body text-sm font-medium text-ink marker:hidden hover:bg-hover [&::-webkit-details-marker]:hidden">
                    {g.heading}
                    <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <span aria-hidden="true" className="font-mono">{g.items.length}</span>
                      <span className="sr-only">{g.items.length} links</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="mt-1 flex flex-col gap-1 pl-3">
                  {g.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      // No prefetch: opening the sheet would fetch some 25 pages
                      // on a phone's data. And each of those responses re-sets
                      // the session cookie, so one still in flight after the
                      // Sign out below signed the person straight back in.
                      prefetch={false}
                      onClick={close}
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
                </details>
              ))}
              {more ? <InstallApp /> : null}
              {more ? (
                <div className="mt-2 border-t border-border pt-2">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-ink-muted hover:bg-hover hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </nav>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
