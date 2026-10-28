// Owns the times a student can choose for the daily flashcard reminder, and
// which daily cron job sends each one.
//
// Vercel's Hobby plan runs a cron job at most once a day, somewhere inside the
// hour it names. So each time below is its own daily job in vercel.json, at
// half past the UTC hour that holds that India time, and the email arrives
// within about half an hour of it. Adding a time means adding its job there.
//
// It deliberately does NOT send anything; lib/studyReminders does. This file
// stays free of Prisma so the settings page can import it in the browser.

/// India times, as 24-hour hours. 19 is the original fixed time, so it stays
/// the default and stays with the main daily job (/api/cron/reminders).
export const REMINDER_HOURS = [7, 9, 13, 17, 19, 21] as const;
export type ReminderHour = (typeof REMINDER_HOURS)[number];
export const MAIN_REMINDER_HOUR: ReminderHour = 19;

export function reminderLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "am" : "pm"}`;
}

export function isReminderHour(value: number): value is ReminderHour {
  return (REMINDER_HOURS as readonly number[]).includes(value);
}
