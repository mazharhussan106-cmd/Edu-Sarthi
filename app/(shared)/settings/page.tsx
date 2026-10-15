// Owns the settings page: reads the current theme and preferences on the
// server, then hands them to the client form that saves changes.
//
// It deliberately reads preferences from the database rather than a cookie.
// The theme needs a cookie because it must be known before first paint;
// nothing else here does.

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/Card";
import { CardColorPicker } from "@/app/(shared)/settings/CardColorPicker";
import { SettingsForm } from "@/app/(shared)/settings/SettingsForm";
import { ShareApp } from "@/app/(shared)/settings/ShareApp";
import { SignOutEverywhere } from "@/app/(shared)/settings/SignOutEverywhere";
import { prefsOf } from "@/lib/preferences";

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { theme: true, preferences: true },
  });

  // Each key parsed on its own over the defaults, so one retired value does
  // not reset the rest.
  const preferences = prefsOf(user?.preferences);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Changes save on their own. There is no save button.
      </p>

      <Card className="mt-6">
        <CardTitle>Appearance and notifications</CardTitle>
        <div className="mt-4">
          <SettingsForm
            initialTheme={user?.theme ?? "LIGHT"}
            initialPreferences={preferences}
          />
        </div>
      </Card>

      {/* Students only: teachers and admins have no flashcards. */}
      {session.user.role === "STUDENT" ? (
        <Card className="mt-6">
          <CardTitle>Flashcard</CardTitle>
          <div className="mt-4">
            <CardColorPicker initial={preferences.cardColor} />
          </div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardTitle>Share EduSarthi</CardTitle>
        <div className="mt-4">
          <ShareApp />
        </div>
      </Card>

      <Card className="mt-6">
        <CardTitle>Security</CardTitle>
        <div className="mt-4">
          <SignOutEverywhere />
        </div>
      </Card>
    </main>
  );
}
