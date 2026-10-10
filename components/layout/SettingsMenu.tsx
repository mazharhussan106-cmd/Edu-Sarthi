// Owns the settings dropdown in the header: theme picker and sign out.
//
// The theme applies to the document immediately and saves in the background.
// A round trip before the colour changes makes the whole app feel slow on
// patchy mobile data, and the change is trivially reversible if it fails.
//
// It deliberately does NOT hold the rest of the preferences. Font, spacing and
// sound belong on the settings page, where they have room to be labelled.

"use client";

import { signOut } from "next-auth/react";
import { Settings } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Theme } from "@prisma/client";

import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { attrFromTheme, THEMES } from "@/lib/theme";

const OPTIONS = THEMES.map((t) => ({ value: t.value, label: t.label }));

export function SettingsMenu({ initialTheme, panel }: { initialTheme: Theme; panel?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [warning, setWarning] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Closes on outside click and on Escape. Both, because a dropdown that only
  // closes on click strands keyboard users inside it.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleThemeChange(next: Theme) {
    setTheme(next);
    setWarning(null);

    // Applied to the live document, not just to state. Nothing re-renders from
    // this value — the CSS variables hang off the attribute.
    const attr = attrFromTheme(next);
    if (attr === "light") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", attr);
    }

    try {
      const res = await fetch("/api/profile/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      });

      // Told, not reverted. Snapping the colours back after the user already
      // saw them change is more confusing than a line of text.
      if (!res.ok) setWarning("Theme applied, but it may not stick next visit.");
    } catch {
      setWarning("Theme applied, but it may not stick next visit.");
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Settings</span>
      </Button>

      {open ? (
        <div
          className={
            panel
              // The full settings are tall, so the panel scrolls inside the
              // screen instead of running off the bottom of a phone. On a
              // phone it spans the width; from sm up it hangs off the button.
              ? "fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface-raised p-4 shadow-lg shadow-shadow sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[24rem] sm:max-h-[calc(100dvh-6rem)]"
              : "absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-surface-raised p-4 shadow-lg shadow-shadow"
          }
        >
          {panel ?? <SegmentedControl
            label="Theme"
            description="Applies straight away."
            options={OPTIONS}
            value={theme}
            onValueChange={(v) => handleThemeChange(v as Theme)}
          />}

          {warning ? (
            <p aria-live="polite" className="mt-2 text-xs text-ink-muted">
              {warning}
            </p>
          ) : null}

          <div className="mt-4 border-t border-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
