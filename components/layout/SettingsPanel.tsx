// Owns the content of the header's settings dropdown: the same controls as the
// Settings page (theme, text size, card colour, notifications, security),
// loaded on the server and handed to the header as a ready-made element.
//
// It reuses the page's own components rather than copying them, so the page
// and the dropdown can never drift apart. It deliberately renders nothing for
// a signed-out visitor, where the header falls back to its small theme picker.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";
import { CardColorPicker } from "@/app/(shared)/settings/CardColorPicker";
import { SettingsForm } from "@/app/(shared)/settings/SettingsForm";
import { ShareApp } from "@/app/(shared)/settings/ShareApp";
import { SignOutEverywhere } from "@/app/(shared)/settings/SignOutEverywhere";

export async function SettingsPanel() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { theme: true, preferences: true } });
  const prefs = prefsOf(user?.preferences);

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="hs-general">
        <h2 id="hs-general" className="font-display text-sm font-bold text-ink">Appearance and notifications</h2>
        <div className="mt-3">
          <SettingsForm initialTheme={user?.theme ?? "LIGHT"} initialPreferences={prefs} />
        </div>
      </section>

      {session.user.role === "STUDENT" ? (
        <section aria-labelledby="hs-card" className="border-t border-border pt-4">
          <h2 id="hs-card" className="font-display text-sm font-bold text-ink">Flashcard</h2>
          <div className="mt-3">
            <CardColorPicker initial={prefs.cardColor} />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="hs-share" className="border-t border-border pt-4">
        <h2 id="hs-share" className="font-display text-sm font-bold text-ink">Share EduSarthi</h2>
        <div className="mt-3">
          <ShareApp />
        </div>
      </section>

      <section aria-labelledby="hs-security" className="border-t border-border pt-4">
        <h2 id="hs-security" className="font-display text-sm font-bold text-ink">Security</h2>
        <div className="mt-3">
          <SignOutEverywhere />
        </div>
      </section>
    </div>
  );
}
