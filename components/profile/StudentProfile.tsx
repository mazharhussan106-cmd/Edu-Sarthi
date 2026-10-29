// Owns the student's Profile (and a guest's): who they are, their habit
// numbers, their goal, badges, their decks, shortcuts, and account and
// privacy, in that order on a phone and in pairs side by side on a computer.
//
// The page is in phone order in the HTML, and a computer only puts pairs next
// to each other, so the reading and Tab order is the same on every screen.
// It deliberately does NOT query directly; lib/profileStats gathers the
// numbers in one round.

import { BadgeCheck, BookOpen, Flame, Globe, History, Layers, Pin, School, Settings, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AccountRows, type Audience } from "@/components/profile/AccountRows";
import { ActivityCalendar, type CalendarDay } from "@/components/profile/ActivityCalendar";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import { EditProfile } from "@/components/profile/EditProfile";
import { GetStarted, stepsFor } from "@/components/profile/GetStarted";
import { GoalCard } from "@/components/profile/GoalCard";
import { IdentityCard, initialsOf, joinedLine } from "@/components/profile/IdentityCard";
import { LinkRow, RowGroup, StatTiles } from "@/components/profile/ProfileParts";
import { SkillScores } from "@/components/profile/SkillScores";
import { badgesFor } from "@/lib/badges";
import { DAILY_GOAL } from "@/lib/progress";
import { displayId } from "@/lib/publicId";
import { todayNumber, type StudentProfile as Data } from "@/lib/profileStats";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ReviewLog (card answers by day) started on this date; before it, only
// recordings can be shown, and the calendar says so.
const CARD_LOG_START = Date.UTC(2026, 9, 26);

function calendarDays(practice: Data["practice"]): CalendarDay[] {
  return [...practice.entries()].map(([day, p]) => ({
    day,
    // One recording weighs like ten card answers: it takes about as long.
    score: p.recordings * 10 + p.cards,
    text: [p.recordings ? plural(p.recordings, "recording") : "", p.cards ? plural(p.cards, "card") : ""].filter(Boolean).join(", "),
  }));
}

export function StudentProfile({ data }: { data: Data }) {
  const { user, prefs, decks } = data;
  const id = displayId(user.publicId);
  const guest = user.isGuest;
  const badges = badgesFor({ submissions: data.submissions, audits: data.audits, streak: data.streak, cardsKnown: data.cardsKnown, decks: decks.owned });
  const today = todayNumber();
  // The streak reads 400 days so a long run is not cut; the sentence says a year.
  const yearDays = [...data.practice.keys()].filter((d) => d > today - 365).length;
  const steps = stepsFor({ guest, goalSet: prefs.goal !== "unset", submissions: data.submissions, audits: data.audits, cardsKnown: data.cardsKnown });

  const audiences: Audience[] = [
    { who: "Teachers", what: `Your recordings and your ID ${id}, so they can audit you. Never your name, email, number, level or goal.` },
    ...(data.institute ? [{ who: `${data.institute.name}'s admin`, what: "Your name and email, to manage the institute's members." }] : []),
    { who: "EduSarthi admins", what: "Your account and what you do here, when they help you, check a report or keep the site safe." },
    { who: "The library and share links", what: "Decks you publish or share by a link show only the name you chose in Settings → How your name shows on public decks, or no name." },
  ];

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-2 md:items-start">
      {guest ? (
        <Card className="border-saffron p-4 md:col-span-2">
          <p className="text-sm font-medium text-ink">This is a guest account.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Your cards are saved only while this account exists. Add your email in Settings → Keep your progress so you never lose them.
          </p>
        </Card>
      ) : null}

      <IdentityCard
        name={user.name}
        initials={initialsOf(user.name, user.email)}
        roleLine={`${guest ? "Guest" : "Student"} · ${joinedLine(user.createdAt)}`}
        chips={
          <>
            <Badge variant="accent" className="font-mono">{id}</Badge>
            {data.institute ? <Badge>{data.institute.name}</Badge> : null}
          </>
        }
        actions={<EditProfile label={user.name ? "Edit profile" : "Add your name"} name={user.name} phone={user.phone} showPhone={!guest} />}
        note={<>Only you see your name here. Teachers see you as <span className="font-mono text-ink">{id}</span>.</>}
      />

      <StatTiles
        label="Your numbers"
        tiles={[
          { icon: Flame, value: data.streak, label: "Day streak" },
          { icon: Trophy, value: data.longest, label: "Longest streak" },
          { icon: Layers, value: data.cardsKnown, label: "Cards known" },
          { icon: BadgeCheck, value: data.audits, label: "Audits received" },
        ]}
      />

      <GetStarted steps={steps} />

      <GoalCard
        goal={prefs.goal}
        level={prefs.level}
        goalDate={prefs.goalDate}
        recordings={data.recordingsToday}
        recordingGoal={guest ? 0 : DAILY_GOAL}
        newCards={data.newCardsToday}
        newPerDay={prefs.newPerDay}
      />

      <SkillScores scores={data.scores} audits={data.audits} />

      <ActivityCalendar
        title="Practice calendar"
        days={calendarDays(data.practice)}
        today={today}
        levels={[1, 10, 25, 50]}
        summary={
          <>
            <b className="font-mono">{yearDays}</b> practice {yearDays === 1 ? "day" : "days"} in the last 12 months · longest streak{" "}
            <b className="font-mono">{data.longest}</b> {data.longest === 1 ? "day" : "days"}
          </>
        }
        note={`A day counts when you send a recording or answer a card.${user.createdAt.getTime() < CARD_LOG_START ? " Card answers are counted from 26 Oct 2026." : ""}`}
        emptyText="No practice days yet. Answer a card or send a recording and today fills in."
      />

      <BadgeGrid badges={badges} />

      {/* Guests cannot make, share or follow decks. */}
      {guest ? null : (
        <RowGroup id="my-content" title="My content">
          <LinkRow href="/decks" icon={BookOpen} title="My decks" subline={`${plural(decks.owned, "deck")} · ${decks.shared} with a share link`} />
          <LinkRow
            href="/decks"
            icon={Globe}
            title="In the library"
            subline={
              decks.inLibrary
                ? `${plural(decks.inLibrary, "deck")} · ${decks.followers === 1 ? "1 learner follows" : `${decks.followers} learners follow`} ${decks.inLibrary === 1 ? "it" : "them"}`
                : "None yet. Submit a deck from its page"
            }
          />
          <LinkRow href="/decks?following=1#following" icon={Pin} title="Decks I follow" subline={decks.following ? plural(decks.following, "deck") : "None yet. Follow one from the library"} />
        </RowGroup>
      )}

      <RowGroup id="shortcuts" title="Shortcuts">
        {data.institute ? (
          <LinkRow href="/institute" icon={School} title={data.institute.name} subline={`You are a ${data.institute.role} here`} />
        ) : null}
        <LinkRow href="/history" icon={History} title="History" subline="Recordings, audits and cards you answered" />
        <LinkRow href="/settings" icon={Settings} title="Settings" subline="Theme, text size, email, password" />
      </RowGroup>

      <AccountRows
        email={user.email}
        emailVerified={user.emailVerified}
        phone={guest ? null : user.phone}
        audiences={audiences}
        canDelete
      />
    </main>
  );
}
