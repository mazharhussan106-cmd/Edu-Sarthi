// Owns the Theme row in Settings and its sheet of themes.
//
// A theme applies to the page the moment it is tapped, before the save
// returns, so the person sees it behind the sheet while choosing. The theme is
// a column on the account (and a cookie, for the first paint), not a
// preference, so it saves through /api/profile/theme.
//
// It tells rather than reverts when the save fails: snapping the colours back
// after the person already saw them change is more confusing.

"use client";

import { useState } from "react";
import type { Theme } from "@prisma/client";

import { RadioList } from "@/components/ui/RadioList";
import { SheetRow } from "@/components/ui/SheetRow";
import { attrFromTheme, THEMES } from "@/lib/theme";

const OPTIONS = THEMES.map((t) => ({ value: t.value, label: t.label }));
const FAILED = "Theme applied, but it may not stick next visit. Check your connection, then choose it again.";

export function ThemeRow({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const [notice, setNotice] = useState<string | null>(null);

  async function choose(next: Theme) {
    setTheme(next);
    setNotice(null);

    // Nothing re-renders from this value: the colours hang off the attribute.
    const attr = attrFromTheme(next);
    if (attr === "light") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", attr);

    try {
      const res = await fetch("/api/profile/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      });
      if (!res.ok) setNotice(FAILED);
    } catch {
      setNotice(FAILED);
    }
  }

  return (
    <SheetRow
      title="Theme"
      subline="Colours for the whole app, on every device."
      value={THEMES.find((t) => t.value === theme)?.label}
      done
    >
      <RadioList label="Theme" hideLabel options={OPTIONS} value={theme} onValueChange={(v) => void choose(v)} />
      {notice ? <p aria-live="polite" className="mt-2 text-xs text-error">{notice}</p> : null}
    </SheetRow>
  );
}
