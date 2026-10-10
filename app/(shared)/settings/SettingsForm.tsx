// Owns the interactive part of the settings page: theme picker and the
// per-setting toggles.
//
// Each change fires its own PATCH. No Save button, so there is no unsaved
// state to track and no way to lose a change by navigating away.
//
// On failure it tells the user rather than reverting. Snapping a toggle back
// under someone's finger is more confusing than a line of text.

"use client";

import { useState } from "react";
import type { Theme } from "@prisma/client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import { attrFromTheme, THEMES } from "@/lib/theme";
import { TEXT_SIZES, type TextSize } from "@/lib/textSize";
import { NEW_PER_DAY_OPTIONS } from "@/lib/preferences";

const THEME_OPTIONS = THEMES.map((t) => ({ value: t.value, label: t.label }));

export type PreferenceState = {
  emailOnAudit: boolean;
  autoplayAudit: boolean;
  textSize: TextSize;
  newPerDay: number;
};

export function SettingsForm({
  initialTheme,
  initialPreferences,
}: {
  initialTheme: Theme;
  initialPreferences: PreferenceState;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [prefs, setPrefs] = useState<PreferenceState>(initialPreferences);
  const [notice, setNotice] = useState<string | null>(null);

  async function saveTheme(next: Theme) {
    setTheme(next);
    setNotice(null);

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
      if (!res.ok) setNotice("Theme applied, but it may not stick next visit.");
    } catch {
      setNotice("Theme applied, but it may not stick next visit.");
    }
  }

  async function savePreference(key: keyof PreferenceState, value: boolean | string | number) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setNotice(null);

    try {
      const res = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) setNotice("That change may not have saved. Reload to check.");
    } catch {
      setNotice("That change may not have saved. Reload to check.");
    }
  }

  return (
    <div>
      <SegmentedControl
        label="Theme"
        description="Applies straight away and follows you to other devices."
        options={THEME_OPTIONS}
        value={theme}
        onValueChange={(v) => void saveTheme(v as Theme)}
      />

      <div className="mt-2 divide-y divide-border border-t border-border">
        <Switch
          label="Email me when an audit arrives"
          description="One email per audit. Nothing else is sent to you."
          checked={prefs.emailOnAudit}
          onCheckedChange={(v) => void savePreference("emailOnAudit", v)}
        />
        <Switch
          label="Start playing when I open an audit"
          description="Off by default, so opening an audit on a bus stays quiet."
          checked={prefs.autoplayAudit}
          onCheckedChange={(v) => void savePreference("autoplayAudit", v)}
        />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <SegmentedControl
          label="Text size"
          description="A− smaller, A normal, A+ larger. Cards get a larger minimum size too."
          options={TEXT_SIZES}
          value={prefs.textSize}
          onValueChange={(v) => {
            // Applied to the live page first, like the theme, so the change is
            // visible under the finger before the save returns.
            if (v === "normal") document.documentElement.removeAttribute("data-text");
            else document.documentElement.setAttribute("data-text", v);
            void savePreference("textSize", v);
          }}
        />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <SegmentedControl
          label="New cards per day"
          description="How many new flashcards you learn each day, on top of the ones due for review. Takes effect on your next card."
          options={NEW_PER_DAY_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
          value={String(prefs.newPerDay)}
          onValueChange={(v) => void savePreference("newPerDay", Number(v))}
        />
      </div>

      {notice ? (
        <p aria-live="polite" className="mt-4 text-xs text-ink-muted">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
