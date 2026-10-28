// Owns the site-wide settings an admin can change without a deploy, kept in
// the AppSetting table: today, how many recordings a student may send for
// audit each day.
//
// Reading never fails a page or a send. A setting that cannot be read (the
// table not created yet after a deploy, a bad stored value) falls back to its
// default and logs it; a student's Send must not break over a setting.
// It deliberately does NOT check who may write; the admin route does. Limits
// and the schema are in lib/appSettingSchemas, which the browser can import.

import { auditsPerDaySchema, DEFAULT_AUDITS_PER_DAY } from "@/lib/appSettingSchemas";
import { prisma } from "@/lib/prisma";

const KEY = "auditsPerDay";

export async function getAuditsPerDay(): Promise<number> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: KEY }, select: { value: true } });
    if (!row) return DEFAULT_AUDITS_PER_DAY;
    const parsed = auditsPerDaySchema.shape.auditsPerDay.safeParse(row.value);
    return parsed.success ? parsed.data : DEFAULT_AUDITS_PER_DAY;
  } catch (err) {
    console.error("Audit limit setting unreadable, using the default", err instanceof Error ? err.message : "unknown error");
    return DEFAULT_AUDITS_PER_DAY;
  }
}

export async function setAuditsPerDay(value: number): Promise<void> {
  await prisma.appSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
}
