// Owns the settings page: the heading and the sign-in check. What appears on
// it, and for whom, is SettingsSections, shared with the header's dropdown.
//
// It deliberately reads preferences from the database rather than a cookie.
// The theme needs a cookie because it must be known before first paint;
// nothing else here does.

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { SettingsSections } from "@/app/(shared)/settings/SettingsSections";

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Changes save on their own. There is no save button.
      </p>

      <SettingsSections userId={session.user.id} variant="page" />
    </main>
  );
}
