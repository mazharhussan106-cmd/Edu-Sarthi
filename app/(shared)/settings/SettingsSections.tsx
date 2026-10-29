// Owns what Settings shows and to whom: reads the account once, works out who
// is looking (student, guest, teacher or admin), and lays the settings out as
// groups of same-sized rows, the way phone settings look.
//
// Every row is one line of name and at most two lines under it. An on/off
// setting is a toggle; anything with choices or a form is a row with a
// chevron whose sheet holds the rest (components/ui/SheetRow). That rule is
// what keeps the page calm, so a new setting follows it too.
//
// It deliberately does NOT save anything; each row's client component does.
// It shows each person only the rows that do something for them: a teacher
// has no flashcards and a guest has no email, and a switch that changes
// nothing looks like it should work.

import type { ReactNode } from "react";

import { prisma } from "@/lib/prisma";
import { NEW_PER_DAY_OPTIONS, PLAYBACK_RATES, prefsOf } from "@/lib/preferences";
import { DAILY_GOALS, STREAK_MIN_XP, WEEKLY_GOALS } from "@/lib/streak";
import { TEXT_SIZES } from "@/lib/textSize";
import { SheetRow } from "@/components/ui/SheetRow";
import { CardColorPicker } from "@/app/(shared)/settings/CardColorPicker";
import { ChangeEmail } from "@/app/(shared)/settings/ChangeEmail";
import { ChangePassword } from "@/app/(shared)/settings/ChangePassword";
import { GuestUpgrade } from "@/app/(shared)/settings/GuestUpgrade";
import { PrefChoiceRow } from "@/app/(shared)/settings/PrefChoiceRow";
import { PrefSwitch } from "@/app/(shared)/settings/PrefSwitch";
import { PublicNameForm } from "@/app/(shared)/settings/PublicNameForm";
import { ReminderSettings } from "@/app/(shared)/settings/ReminderSettings";
import { ShareApp } from "@/app/(shared)/settings/ShareApp";
import { SignOutEverywhere } from "@/app/(shared)/settings/SignOutEverywhere";
import { SignOutRow } from "@/app/(shared)/settings/SignOutRow";
import { ThemeRow } from "@/app/(shared)/settings/ThemeRow";
import { VoiceSettings } from "@/app/(shared)/settings/VoiceSettings";

const TEXT_NAMES = { small: "Smaller", normal: "Normal", large: "Larger" } as const;
const TEXT_OPTIONS = TEXT_SIZES.map((t) => ({ value: t.value, label: `${TEXT_NAMES[t.value]} (${t.label})`, short: t.label }));
const SPEED_OPTIONS = PLAYBACK_RATES.map((r) => ({ value: String(r), label: r === 1 ? "1x, normal speed" : `${r}x`, short: `${r}x` }));
const NEW_OPTIONS = NEW_PER_DAY_OPTIONS.map((n) => ({ value: String(n), label: `${n} new cards`, short: String(n) }));
const DAILY_OPTIONS = DAILY_GOALS.map((g) => ({ value: String(g.xp), label: `${g.name} · ${g.xp} XP, ${g.time}`, short: `${g.xp} XP` }));
const WEEKLY_OPTIONS = WEEKLY_GOALS.map((d) => ({ value: String(d), label: d === 7 ? "Every day" : `${d} days a week`, short: `${d} days` }));

function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-6">
      <h2 id={id} className="px-1 font-display text-xs font-bold uppercase tracking-wider text-ink-muted">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface px-4">{children}</div>
    </section>
  );
}

export async function SettingsSections({ userId }: { userId: string }) {
  // The role comes from the row, not the session token: a token can be older
  // than a promotion or a demotion.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { theme: true, preferences: true, role: true, isGuest: true, name: true, email: true, creditStyle: true, publicName: true, passwordHash: true },
  });
  if (!user) return null;

  // Each key parsed on its own over the defaults, so one retired value does
  // not reset the rest.
  const p = prefsOf(user.preferences);
  const learner = user.role === "STUDENT";
  const member = !user.isGuest;
  const reviewer = user.role === "TEACHER" || user.role === "ADMIN";
  const student = learner && member;
  // Only whether a password exists crosses to the browser, never the hash.
  const hasPassword = Boolean(user.passwordHash);

  return (
    <>
      {/* First for a guest: the one step that keeps their progress. */}
      {!member ? (
        <Group id="settings-progress" title="Your progress">
          <SheetRow title="Keep your progress" subline="Add your email so your cards are kept, and get the email settings." form>
            <GuestUpgrade />
          </SheetRow>
        </Group>
      ) : null}

      <Group id="settings-appearance" title="Appearance">
        <ThemeRow initial={user.theme} />
        <PrefChoiceRow
          pref="textSize"
          title="Text size"
          subline="Bigger or smaller text on cards and pages."
          explain="Cards get a larger minimum text size too."
          options={TEXT_OPTIONS}
          initial={p.textSize}
          attr={{ name: "data-text", unsetFor: "normal" }}
        />
        {learner ? <CardColorPicker initial={p.cardColor} /> : null}
        <PrefSwitch
          pref="reduceMotion"
          label="Reduce motion"
          description="Cards change sides without turning, and other movement stops."
          initial={p.reduceMotion}
          attr={{ name: "data-motion", value: "reduce" }}
        />
      </Group>

      {/* Students only: teachers and admins have no flashcards. */}
      {learner ? (
        <Group id="settings-flashcards" title="Flashcards">
          <PrefChoiceRow
            pref="dailyGoalXp"
            title="Daily goal"
            subline="The XP that fills the ring on your Dashboard."
            explain={`A new card is 2 XP, a review 1 XP and a recording 10 XP. Your streak needs ${STREAK_MIN_XP} XP a day, whatever goal you choose.`}
            options={DAILY_OPTIONS}
            initial={String(p.dailyGoalXp)}
            numeric
            anchor="daily-goal"
          />
          <PrefChoiceRow
            pref="weeklyGoalDays"
            title="Weekly goal"
            subline="Days a week you aim to fill the ring."
            explain="The week runs Monday to Sunday, India time. Rest days are part of the plan."
            options={WEEKLY_OPTIONS}
            initial={String(p.weeklyGoalDays)}
            numeric
            anchor="weekly-goal"
          />
          <PrefChoiceRow
            pref="newPerDay"
            title="New cards per day"
            subline="New cards each day. Reviews have no limit."
            explain="On top of the cards due for review. Takes effect on your next card."
            options={NEW_OPTIONS}
            initial={String(p.newPerDay)}
            numeric
          />
          <VoiceSettings initialAccent={p.voiceAccent} initialSpeed={p.voiceSpeed} />
          <PrefSwitch pref="autoSpeak" label="Say each word aloud" description="Plays the word when its card opens." initial={p.autoSpeak} />
          <PrefSwitch
            pref="hideHindi"
            label="Hide Hindi meanings"
            description="Hides the Hindi boxes on cards, so you think in English."
            initial={p.hideHindi}
            attr={{ name: "data-hindi", value: "off" }}
          />
          <PrefSwitch
            pref="hideHindiTask"
            label="Hide Hindi→English questions"
            description="Hides the practice questions that ask you to translate Hindi."
            initial={p.hideHindiTask}
            attr={{ name: "data-hindi-task", value: "off" }}
          />
        </Group>
      ) : null}

      {/* A guest cannot record or upload. */}
      {member ? (
        <Group id="settings-recordings" title={student ? "Recordings & audits" : "Recordings"}>
          {student ? (
            <PrefSwitch pref="autoplayAudit" label="Play audits on open" description="Starts your recording when you open an audit. Off keeps it quiet." initial={p.autoplayAudit} />
          ) : null}
          {student ? (
            <PrefChoiceRow
              pref="playbackRate"
              title="Audit playback speed"
              subline="The speed your recording starts at in an audit."
              explain="The buttons under the player still change it for one listen."
              options={SPEED_OPTIONS}
              initial={String(p.playbackRate)}
              numeric
            />
          ) : null}
          <PrefSwitch
            pref="dataSaver"
            label="Data saver"
            description="Records at lower quality, so uploads are faster on slow data."
            initial={p.dataSaver}
            attr={{ name: "data-saver", value: "on" }}
          />
        </Group>
      ) : null}

      {member && (student || reviewer) ? (
        <Group id="settings-email" title="Email">
          {student ? <PrefSwitch pref="emailOnAudit" label="Audit returned" description="One email when a teacher returns your audit, with a link." initial={p.emailOnAudit} /> : null}
          {student ? <ReminderSettings initialOn={p.emailReminder} initialHour={p.reminderHour} /> : null}
          {reviewer ? <PrefSwitch pref="emailQueueDigest" label="Daily queue email" description="Around 7 pm India time, only when recordings are waiting." initial={p.emailQueueDigest} /> : null}
          {reviewer ? <PrefSwitch pref="emailOnNewRecording" label="Each new recording" description="One email per new recording. On a busy day that is many." initial={p.emailOnNewRecording} /> : null}
        </Group>
      ) : null}

      <Group id="settings-account" title="Account & security">
        {member && user.email ? (
          <SheetRow title="Change email" subline={user.email} form>
            <ChangeEmail currentEmail={user.email} hasPassword={hasPassword} />
          </SheetRow>
        ) : null}
        {member ? (
          <SheetRow
            title={hasPassword ? "Change password" : "Password"}
            subline={hasPassword ? "Also signs you out on every device." : "You sign in without one. See how to add one."}
            form={hasPassword}
          >
            <ChangePassword hasPassword={hasPassword} />
          </SheetRow>
        ) : null}
        {/* Guests cannot publish, and admins' decks are credited to EduSarthi. */}
        {member && user.role !== "ADMIN" ? (
          <SheetRow title="Name on public decks" subline="How you are credited on decks you publish." anchor="public-name">
            <PublicNameForm accountName={user.name} initialStyle={user.creditStyle} initialPublicName={user.publicName} teacher={user.role === "TEACHER"} />
          </SheetRow>
        ) : null}
        {/* Signing out everywhere would strand a guest, who has nothing to sign back in with. */}
        {member ? (
          <SheetRow title="Sign out of all devices" subline="For a lost phone or a shared computer.">
            <SignOutEverywhere />
          </SheetRow>
        ) : null}
        <SignOutRow guest={!member} />
      </Group>

      <Group id="settings-share" title="Share">
        <SheetRow title="Share EduSarthi" subline="Send the app link to a friend." anchor="share">
          <ShareApp />
        </SheetRow>
      </Group>
    </>
  );
}
