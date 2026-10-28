// Owns the interactive part of the settings page: theme picker and the
// per-setting toggles.
//
// Each change fires its own PATCH. No Save button, so there is no unsaved
// state to track and no way to lose a change by navigating away.
//
// On failure it tells the user rather than reverting. Snapping a toggle back
// under someone's finger is more confusing than a line of text.
//
// It shows each person only the settings that do something for them (see
// SettingsAudience). A teacher has no flashcards and a guest has no email; a
// switch that changes nothing is worse than no switch, because it looks like
// it should work. It deliberately does NOT decide who is who: the server
// component above it does, from the account row.

"use client";

import { useState } from "react";
import type { Theme } from "@prisma/client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import { useSavePreference } from "@/app/(shared)/settings/useSavePreference";
import { attrFromTheme, THEMES } from "@/lib/theme";
import { TEXT_SIZES } from "@/lib/textSize";
import { NEW_PER_DAY_OPTIONS, PLAYBACK_RATES, type PlaybackRate, type Preferences } from "@/lib/preferences";

const THEME_OPTIONS = THEMES.map((t) => ({ value: t.value, label: t.label }));

/// Everything this form edits. Profile owns level and goal; the card colour and
/// the read-aloud voice have their own controls in the Flashcard section.
export type PreferenceState = Omit<Preferences, "level" | "goal" | "cardColor" | "voiceAccent" | "voiceSpeed">;

export type SettingsAudience = {
  /// A student: studies flashcards and receives audits.
  learner: boolean;
  /// Not a guest: has an email and can record and upload.
  member: boolean;
  /// A teacher or an admin: works the review queue.
  reviewer: boolean;
};

export function SettingsForm({
  initialTheme,
  initialPreferences,
  audience,
}: {
  initialTheme: Theme;
  initialPreferences: PreferenceState;
  audience: SettingsAudience;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [prefs, setPrefs] = useState<PreferenceState>(initialPreferences);
  const [themeNotice, setThemeNotice] = useState<string | null>(null);
  const { save, notice: saveNotice } = useSavePreference();
  const notice = themeNotice ?? saveNotice;
  const { learner, member, reviewer } = audience;
  const student = learner && member;

  async function saveTheme(next: Theme) {
    setTheme(next);
    setThemeNotice(null);

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
      if (!res.ok) setThemeNotice("Theme applied, but it may not stick next visit.");
    } catch {
      setThemeNotice("Theme applied, but it may not stick next visit.");
    }
  }

  function savePreference<K extends keyof PreferenceState>(key: K, value: PreferenceState[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setThemeNotice(null);
    // Same type, but TypeScript cannot see through Omit on a generic key.
    void save(key, value as Preferences[K]);
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
        {student ? (
          <Switch
            label="Email me when a teacher returns my audit"
            description="One email per audit, with a link. The scores stay behind sign-in."
            checked={prefs.emailOnAudit}
            onCheckedChange={(v) => void savePreference("emailOnAudit", v)}
          />
        ) : null}
        {student ? (
          <Switch
            label="Daily flashcard reminder email"
            description="One email around 7 pm India time, only on days when cards are due. The time is fixed for now."
            checked={prefs.emailReminder}
            onCheckedChange={(v) => void savePreference("emailReminder", v)}
          />
        ) : null}
        {reviewer ? (
          <Switch
            label="Daily queue email"
            description="One email around 7 pm India time, only when recordings are waiting for you, with how many are close to their deadline."
            checked={prefs.emailQueueDigest}
            onCheckedChange={(v) => void savePreference("emailQueueDigest", v)}
          />
        ) : null}
        {student ? (
          <Switch
            label="Start playing when I open an audit"
            description="Off by default, so opening an audit on a bus stays quiet."
            checked={prefs.autoplayAudit}
            onCheckedChange={(v) => void savePreference("autoplayAudit", v)}
          />
        ) : null}
        {member ? (
          <Switch
            label="Data saver for recordings"
            description="New recordings are made at lower quality so they upload faster on slow data. Playback is not changed."
            checked={prefs.dataSaver}
            onCheckedChange={(v) => {
              if (v) document.documentElement.setAttribute("data-saver", "on");
              else document.documentElement.removeAttribute("data-saver");
              void savePreference("dataSaver", v);
            }}
          />
        ) : null}
        {learner ? (
          <Switch
            label="Hide Hindi meanings on cards"
            description="Hides the Hindi boxes, and “In your language” on imported decks, so you think in English. The Hindi to English practice question stays."
            checked={prefs.hideHindi}
            onCheckedChange={(v) => {
              // Applied now, like the text size, then saved.
              if (v) document.documentElement.setAttribute("data-hindi", "off");
              else document.documentElement.removeAttribute("data-hindi");
              void savePreference("hideHindi", v);
            }}
          />
        ) : null}
        {learner ? (
          <Switch
            label="Say each word when its card opens"
            description="Off by default. Uses the recording, or your phone's Indian English voice."
            checked={prefs.autoSpeak}
            onCheckedChange={(v) => void savePreference("autoSpeak", v)}
          />
        ) : null}
        <Switch
          label="Reduce motion"
          description="Cards change sides without turning, and other movement in the app stops. Your phone's own reduce-motion setting already does this when it is on."
          checked={prefs.reduceMotion}
          onCheckedChange={(v) => {
            // Applied now, like the text size, then saved.
            if (v) document.documentElement.setAttribute("data-motion", "reduce");
            else document.documentElement.removeAttribute("data-motion");
            void savePreference("reduceMotion", v);
          }}
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

      {learner ? (
        <div className="mt-4 border-t border-border pt-4">
          <SegmentedControl
            label="New cards per day"
            description="How many new flashcards you learn each day, on top of the ones due for review. Takes effect on your next card."
            options={NEW_PER_DAY_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(prefs.newPerDay)}
            onValueChange={(v) => void savePreference("newPerDay", Number(v))}
          />
        </div>
      ) : null}

      {student ? (
        <div className="mt-4 border-t border-border pt-4">
          <SegmentedControl
            label="Audit playback speed"
            description="The speed your recording starts at when you open an audit. The buttons under the player still change it for one listen."
            options={PLAYBACK_RATES.map((r) => ({ value: String(r), label: `${r}x` }))}
            value={String(prefs.playbackRate)}
            onValueChange={(v) => void savePreference("playbackRate", Number(v) as PlaybackRate)}
          />
        </div>
      ) : null}

      {learner && !member ? (
        <p className="mt-4 border-t border-border pt-4 text-xs text-ink-muted">
          You are using a guest account, so email, recording and audit settings are not shown. Sign
          out, then create a free account or continue with Google to get them.
        </p>
      ) : null}

      {notice ? (
        <p aria-live="polite" className="mt-4 text-xs text-ink-muted">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
