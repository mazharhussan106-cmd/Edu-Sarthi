// Owns the daily flashcard reminder row in Settings → Email and its sheet: on
// or off, and the time it comes (lib/reminderTimes, one daily cron job per
// time). The row shows "Off" or the chosen time.
//
// The time choice shows only while the reminder is on; a time for an email
// that is not coming is one more thing to read for nothing. It deliberately
// promises "about" the time: on Vercel's Hobby plan a daily job runs somewhere
// inside its hour.

"use client";

import { useState } from "react";

import { RadioList } from "@/components/ui/RadioList";
import { SheetRow } from "@/components/ui/SheetRow";
import { Switch } from "@/components/ui/Switch";
import { useSavePreference } from "@/app/(shared)/settings/useSavePreference";
import { REMINDER_HOURS, reminderLabel, type ReminderHour } from "@/lib/reminderTimes";

export function ReminderSettings({ initialOn, initialHour }: { initialOn: boolean; initialHour: ReminderHour }) {
  const [on, setOn] = useState(initialOn);
  const [hour, setHour] = useState(initialHour);
  const { save, notice } = useSavePreference();

  return (
    <SheetRow
      title="Daily flashcard reminder"
      subline="Only on days when cards are due."
      value={on ? reminderLabel(hour) : "Off"}
      done
    >
      <Switch
        label="Send the reminder"
        description="One email a day, only when you have cards to review."
        checked={on}
        onCheckedChange={(v) => {
          setOn(v);
          void save("emailReminder", v);
        }}
      />
      {on ? (
        <div className="mt-2">
          <RadioList
            label="Time"
            description="India time. It arrives within about half an hour of the time you pick."
            options={REMINDER_HOURS.map((h) => ({ value: String(h), label: reminderLabel(h) }))}
            value={String(hour)}
            onValueChange={(v) => {
              // Only the listed times are offered, so this is one of them.
              const next = Number(v) as ReminderHour;
              setHour(next);
              void save("reminderHour", next);
            }}
          />
        </div>
      ) : null}
      {notice ? <p aria-live="polite" className="mt-2 text-xs text-error">{notice}</p> : null}
    </SheetRow>
  );
}
