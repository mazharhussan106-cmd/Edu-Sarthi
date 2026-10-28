// Owns the daily flashcard reminder in Settings → Flashcard: on or off, and
// the time it comes (lib/reminderTimes, one daily cron job per time).
//
// The time choice shows only while the reminder is on; a time for an email
// that is not coming is one more thing to read for nothing. It deliberately
// promises "about" the time: on Vercel's Hobby plan a daily job runs somewhere
// inside its hour.

"use client";

import { useState } from "react";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import { useSavePreference } from "@/app/(shared)/settings/useSavePreference";
import { REMINDER_HOURS, reminderLabel, type ReminderHour } from "@/lib/reminderTimes";

export function ReminderSettings({ initialOn, initialHour }: { initialOn: boolean; initialHour: ReminderHour }) {
  const [on, setOn] = useState(initialOn);
  const [hour, setHour] = useState(initialHour);
  const { save, notice } = useSavePreference();

  return (
    <div className="border-t border-border pt-1">
      <Switch
        label="Daily flashcard reminder email"
        description={`One email around ${reminderLabel(hour)} India time, only on days when cards are due.`}
        checked={on}
        onCheckedChange={(v) => {
          setOn(v);
          void save("emailReminder", v);
        }}
      />
      {on ? (
        <SegmentedControl
          label="Reminder time"
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
      ) : null}
      {notice ? <p aria-live="polite" className="mt-2 text-xs text-ink-muted">{notice}</p> : null}
    </div>
  );
}
