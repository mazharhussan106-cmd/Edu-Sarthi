// Owns the student app's bottom navigation bar on phones: Dashboard,
// Flashcard, Audited, Class, Profile. Hidden from md upward, where the header carries the links.
//
// It deliberately hides itself on focused screens — recording, reading one
// audit, re-recording — so a thumb reaching for Stop never lands on "Home".

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, House, Layers, UserRound, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { STUDENT_LINKS } from "@/lib/studentNav";

const ICONS = {
  "/dashboard": House,
  "/flashcards": Layers,
  "/feedback": ClipboardCheck,
  "/class": Video,
  "/profile": UserRound,
} as const;

// Matches the spec: bottom bar hidden inside a practice or audit session.
const FOCUSED = [/^\/practice\//, /^\/feedback\/[^/]+/];

export function BottomNav() {
  const pathname = usePathname();
  if (FOCUSED.some((r) => r.test(pathname))) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-nav-bg backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-5">
        {STUDENT_LINKS.map((link) => {
          const Icon = ICONS[link.href as keyof typeof ICONS];
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`) ||
            // Settings is reached from Profile, so Profile stays lit there.
            (link.href === "/profile" && pathname.startsWith("/settings")) ||
            // Speaking modules are reached from Class, so Class stays lit there.
            (link.href === "/class" && (pathname.startsWith("/modules") || pathname.startsWith("/practice")));
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]",
                  active ? "font-semibold text-accent" : "text-ink-muted",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
