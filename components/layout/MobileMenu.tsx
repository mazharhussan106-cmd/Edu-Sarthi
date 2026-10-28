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
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { InstallApp } from "@/components/layout/InstallApp";
import { MenuGroupDetails } from "@/components/layout/MenuGroupDetails";
import type { NavLink } from "@/components/layout/NavLinks";
import { MAIN_PAGES, type MenuGroup } from "@/lib/studentNav";

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

            <nav className="flex flex-col overflow-y-auto p-3">
              {more ? (
                // The student menu: one divided list, so every row that shows
                // gets exactly one line under it — Install app (always on top,
                // owner's choice), the five main pages folded as "Main pages",
                // the other groups, Sign out. A row that is not shown (Main
                // pages on a computer, where they are in the header; Install
                // once the app is installed) leaves no stray line behind.
                <div className="flex flex-col divide-y divide-border">
                  <InstallApp />
                  <MenuGroupDetails group={{ ...MAIN_PAGES, items: links }} pathname={pathname} onNavigate={close} matchPrefix className="md:hidden" />
                  {more.map((g) => (
                    <MenuGroupDetails key={g.heading} group={g} pathname={pathname} onNavigate={close} />
                  ))}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-ink-muted hover:bg-hover hover:text-ink"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                // Teachers and admins: their few links, flat, on phones only.
                <div className="flex flex-col gap-1">
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
              )}
            </nav>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
