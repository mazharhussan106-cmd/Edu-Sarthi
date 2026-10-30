// Owns a Settings row for a preference with a few fixed choices (text size,
// audit playback speed, new cards and reviews per day, the daily and weekly goals): the
// row shows the current choice, and its sheet lists them all, with the longer
// explanation under the list.
//
// A choice applies on tap, like a toggle; the sheet stays open so a person can
// try the next one, and Done closes it. It deliberately does NOT know which
// settings exist; SettingsSections passes the options.

"use client";

import { useState } from "react";

import { RadioList } from "@/components/ui/RadioList";
import { SheetRow } from "@/components/ui/SheetRow";
import { useSavePreference } from "@/app/(shared)/settings/useSavePreference";
import type { Preferences } from "@/lib/preferences";

type ChoicePref = "textSize" | "playbackRate" | "newPerDay" | "reviewsPerDay" | "dailyGoalXp" | "weeklyGoalDays";

export function PrefChoiceRow({
  pref,
  title,
  subline,
  explain,
  options,
  initial,
  numeric = false,
  attr,
  anchor,
}: {
  pref: ChoicePref;
  title: string;
  subline: string;
  /** The fuller explanation, shown in the sheet under the choices. */
  explain?: string;
  /** "short" is what the row shows, e.g. "A+" for "Large (A+)". */
  options: readonly { value: string; label: string; short: string }[];
  initial: string;
  /** Saved as a number (speed, cards per day) rather than a word. */
  numeric?: boolean;
  /** Set on <html> to the choice, and removed for the default one. */
  attr?: { name: string; unsetFor: string };
  /** Lets a link such as /settings#daily-goal open this row's sheet. */
  anchor?: string;
}) {
  const [value, setValue] = useState(initial);
  const { save, notice } = useSavePreference();
  const current = options.find((o) => o.value === value);

  return (
    <SheetRow title={title} subline={subline} value={current?.short} anchor={anchor} done>
      <RadioList
        label={title}
        hideLabel
        options={options}
        value={value}
        onValueChange={(v) => {
          setValue(v);
          if (attr) {
            if (v === attr.unsetFor) document.documentElement.removeAttribute(attr.name);
            else document.documentElement.setAttribute(attr.name, v);
          }
          // Only the listed values are offered, so this is one of them.
          void save(pref, (numeric ? Number(v) : v) as Preferences[ChoicePref]);
        }}
      />
      {explain ? <p className="mt-3 text-xs text-ink-muted">{explain}</p> : null}
      {notice ? <p aria-live="polite" className="mt-2 text-xs text-error">{notice}</p> : null}
    </SheetRow>
  );
}
