// Owns Admin → Settings: the site-wide numbers an admin changes without a
// deploy (lib/appSettings). Today: how many recordings each student may send
// for audit a day.
//
// It deliberately shows the value the site is using right now, which is the
// default until an admin saves one.

import { ensureActiveUser } from "@/lib/activeUser";
import { DEFAULT_AUDITS_PER_DAY } from "@/lib/appSettingSchemas";
import { getAuditsPerDay } from "@/lib/appSettings";
import { Card, CardTitle } from "@/components/ui/Card";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  await ensureActiveUser(["ADMIN"]);
  const auditsPerDay = await getAuditsPerDay();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-muted">Numbers that apply to everyone. Every change is in the admin log.</p>

      <Card className="mt-6">
        <CardTitle>Recordings for audit</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">
          Teachers’ time is the scarce part. This caps how many recordings each student can send for a teacher’s audit in a day. The
          starting value is {DEFAULT_AUDITS_PER_DAY}.
        </p>
        <div className="mt-4">
          <SiteSettingsForm auditsPerDay={auditsPerDay} />
        </div>
      </Card>
    </main>
  );
}
