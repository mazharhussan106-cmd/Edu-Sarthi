// Owns one on/off preference row in Settings: the toggle, the save, and the
// attribute on <html> that makes the change visible before the save returns.
//
// The attribute is passed as data, not as a callback, because the server
// component that lays out Settings cannot hand a function to the browser. It
// deliberately does NOT decide who sees the row; SettingsSections does.

"use client";

import { useState } from "react";

import { Switch } from "@/components/ui/Switch";
import { useSavePreference } from "@/app/(shared)/settings/useSavePreference";
import type { Preferences } from "@/lib/preferences";

type BooleanPref = { [K in keyof Preferences]: Preferences[K] extends boolean ? K : never }[keyof Preferences];

export function PrefSwitch({
  pref,
  label,
  description,
  initial,
  attr,
}: {
  pref: BooleanPref;
  label: string;
  description: string;
  initial: boolean;
  /** Set to this value while on, removed while off; CSS reads it at once. */
  attr?: { name: string; value: string };
}) {
  const [on, setOn] = useState(initial);
  const { save, notice } = useSavePreference();

  return (
    <div>
      <Switch
        label={label}
        description={description}
        checked={on}
        onCheckedChange={(v) => {
          setOn(v);
          if (attr) {
            if (v) document.documentElement.setAttribute(attr.name, attr.value);
            else document.documentElement.removeAttribute(attr.name);
          }
          void save(pref, v);
        }}
      />
      {notice ? <p aria-live="polite" className="-mt-1 pb-3 text-xs text-error">{notice}</p> : null}
    </div>
  );
}
