// Owns the header's Settings button: a plain link to the Settings page.
//
// It used to open a dropdown with the full settings in it. That made two
// copies of every setting, and a setting's sheet would have opened on top of
// the dropdown, so the owner chose one place (29 Oct). Sign out, which the
// dropdown also held, is on the Settings page and in the menu.
//
// Every header that shows it belongs to a signed-in layout, so there is no
// signed-out version to offer. On the Settings page it is marked current, the
// way the nav links mark theirs.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

import { cn } from "@/lib/utils";

export function SettingsMenu() {
  const here = usePathname() === "/settings";

  return (
    <Link
      href="/settings"
      aria-label="Settings"
      aria-current={here ? "page" : undefined}
      className={cn(
        "inline-flex h-8 min-h-8 items-center justify-center gap-2 rounded-lg px-3 font-body text-xs font-medium transition-colors hover:bg-hover hover:text-ink",
        here ? "text-accent-dark" : "text-ink-muted",
      )}
    >
      <Settings className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Settings</span>
    </Link>
  );
}
