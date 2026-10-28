// Owns what Settings shows and to whom: reads the account once, works out who
// is looking (student, guest, teacher or admin), and lays out the sections.
// The Settings page and the header's settings dropdown both render this, so
// the two can never offer different settings again.
//
// It deliberately does NOT save anything; each section's client component
// does. "variant" only changes the frame: cards on the page, plain stacked
// sections in the narrow dropdown.

import type { ReactNode } from "react";

import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";
import { Card, CardTitle } from "@/components/ui/Card";
import { CardColorPicker } from "@/app/(shared)/settings/CardColorPicker";
import { ChangeEmail } from "@/app/(shared)/settings/ChangeEmail";
import { GuestUpgrade } from "@/app/(shared)/settings/GuestUpgrade";
import { ChangePassword } from "@/app/(shared)/settings/ChangePassword";
import { PublicNameForm } from "@/app/(shared)/settings/PublicNameForm";
import { ReminderSettings } from "@/app/(shared)/settings/ReminderSettings";
import { SettingsForm } from "@/app/(shared)/settings/SettingsForm";
import { ShareApp } from "@/app/(shared)/settings/ShareApp";
import { SignOutEverywhere } from "@/app/(shared)/settings/SignOutEverywhere";
import { StudyLimits } from "@/app/(shared)/settings/StudyLimits";
import { VoiceSettings } from "@/app/(shared)/settings/VoiceSettings";

type Variant = "page" | "panel";

// "anchor" is set on the page only: menu links such as /settings#share land on
// it, and the dropdown can be open on the same page, so it must not repeat it.
function Section({ variant, id, anchor, title, children }: { variant: Variant; id: string; anchor?: string; title: string; children: ReactNode }) {
  if (variant === "page") {
    return (
      <Card id={anchor} className="mt-6 scroll-mt-20">
        <CardTitle>{title}</CardTitle>
        <div className="mt-4">{children}</div>
      </Card>
    );
  }
  return (
    <section aria-labelledby={id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h2 id={id} className="font-display text-sm font-bold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export async function SettingsSections({ userId, variant }: { userId: string; variant: Variant }) {
  // The role comes from the row, not the session token: a token can be older
  // than a promotion or a demotion.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { theme: true, preferences: true, role: true, isGuest: true, name: true, email: true, creditStyle: true, publicName: true, passwordHash: true },
  });
  if (!user) return null;

  // Each key parsed on its own over the defaults, so one retired value does
  // not reset the rest.
  const preferences = prefsOf(user.preferences);
  const audience = {
    learner: user.role === "STUDENT",
    member: !user.isGuest,
    reviewer: user.role === "TEACHER" || user.role === "ADMIN",
  };
  // Prefixed per variant: the page and the open dropdown can both be on screen.
  const id = (name: string) => `settings-${variant}-${name}`;

  const sections = (
    <>
      {/* First for a guest: the one step that keeps their progress. */}
      {!audience.member ? (
        <Section variant={variant} id={id("upgrade")} title="Keep your progress">
          <GuestUpgrade />
        </Section>
      ) : null}

      <Section variant={variant} id={id("general")} title="Appearance and notifications">
        <SettingsForm initialTheme={user.theme} initialPreferences={preferences} audience={audience} />
      </Section>

      {/* Students only: teachers and admins have no flashcards. */}
      {audience.learner ? (
        <Section variant={variant} id={id("card")} title="Flashcard">
          <div className="flex flex-col gap-4">
            <CardColorPicker initial={preferences.cardColor} />
            <StudyLimits initialNew={preferences.newPerDay} />
            {/* A guest has no email to send a reminder to. */}
            {audience.member ? <ReminderSettings initialOn={preferences.emailReminder} initialHour={preferences.reminderHour} /> : null}
            <VoiceSettings initialAccent={preferences.voiceAccent} initialSpeed={preferences.voiceSpeed} />
          </div>
        </Section>
      ) : null}

      {/* Guests cannot publish, and admins' decks are credited to EduSarthi. */}
      {audience.member && user.role !== "ADMIN" ? (
        <Section variant={variant} id={id("credit")} anchor="public-name" title="How your name shows on public decks">
          <PublicNameForm
            accountName={user.name}
            initialStyle={user.creditStyle}
            initialPublicName={user.publicName}
            teacher={user.role === "TEACHER"}
          />
        </Section>
      ) : null}

      <Section variant={variant} id={id("share")} anchor="share" title="Share EduSarthi">
        <ShareApp />
      </Section>

      <Section variant={variant} id={id("security")} title="Security">
        {audience.member ? (
          <div className="flex flex-col gap-5">
            {user.email ? <ChangeEmail currentEmail={user.email} hasPassword={Boolean(user.passwordHash)} /> : null}
            {/* Only whether a password exists crosses to the browser, never the hash. */}
            <div className={user.email ? "border-t border-border pt-4" : undefined}>
              <ChangePassword hasPassword={Boolean(user.passwordHash)} />
            </div>
            <div className="border-t border-border pt-4">
              <SignOutEverywhere />
            </div>
          </div>
        ) : (
          // Signing out everywhere would strand a guest: a guest account has
          // no password or email to sign back in with.
          <p className="text-sm text-ink-muted">
            A guest account has no password or email, so there is nothing to change here. Signing
            out ends this guest account, and it cannot be opened again. Add your email under Keep
            your progress first if you want to come back to it.
          </p>
        )}
      </Section>
    </>
  );

  return variant === "page" ? sections : <div className="flex flex-col gap-4">{sections}</div>;
}
