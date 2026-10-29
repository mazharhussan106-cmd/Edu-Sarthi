// Owns the student's Profile (and a guest's): who they are, their habit
// numbers, their goal, badges, their decks, shortcuts, and account and
// privacy, in that order on a phone and in pairs side by side on a computer.
//
// The page is in phone order in the HTML, and a computer only puts pairs next
// to each other, so the reading and Tab order is the same on every screen.
// Streak, XP, badges and skill numbers are the dashboard's (lib/streak and
// friends), so the two pages always agree. It deliberately does NOT query
// directly; lib/profileStats gathers the numbers in one round.

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
import { ShareProgress } from "@/components/profile/ShareProgress";
import { SkillScores } from "@/components/profile/SkillScores";
import { badgesFor } from "@/lib/badges";
import { displayId } from "@/lib/publicId";
import { dayNumberOf, type StudentProfile as Data } from "@/lib/profileStats";
import { STREAK_MIN_XP, XP_NEW_CARD, XP_RECORDING, XP_REVIEW, addDays } from "@/lib/streak";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ReviewLog (card answers by day) started on this date; before it, card XP
// cannot be shown, and the calendar says so.
const CARD_LOG_START = Date.UTC(2026, 9, 26);

/// One square per day with XP, shaded by XP (lib/xp), and the days a streak
/// freeze covered, so the year view tells the same story as the dashboard.
function calendarDays(data: Data): CalendarDay[] {
  const days: CalendarDay[] = [...data.xp.entries()].map(([day, d]) => ({
    day: dayNumberOf(day),
    score: d.xp,
    text: [
      `${d.xp} XP`,
      d.recordings ? plural(d.recordings, "recording") : "",
      d.newCards + d.reviews ? plural(d.newCards + d.reviews, "card") : "",
    ]
      .filter(Boolean)
      .join(" · "),
  }));
  for (const day of data.frozen) if (!data.xp.has(day)) days.push({ day: dayNumberOf(day), score: 0, text: "Streak freeze used" });
  return days;
}

export function StudentProfile({ data }: { data: Data }) {
  const { user, prefs, decks } = data;
  const id = displayId(user.publicId);
  const guest = user.isGuest;
  // The same inputs the dashboard passes (lib/dashboard), so both agree.
  const badges = badgesFor({
    submissions: data.submissions,
    audits: data.audits,
    streak: data.streak,
    longestStreak: data.longest,
    cardsKnown: data.cardsKnown,
    decks: decks.owned,
    bestDayXp: data.bestDayXp,
    weeksMet: data.weeksMet,
    goalSet: prefs.goal !== "unset",
    sharedDecks: decks.sharedOrListed,
    bestScoreGain: Math.max(0, ...data.scores.map((s) => s.change ?? 0)),
  });
  const yearAgo = addDays(data.today, -365);
  const yearDays = [...data.xp.entries()].filter(([day, d]) => day > yearAgo && d.xp >= STREAK_MIN_XP).length;
  const best = [...data.scores].sort((a, b) => (b.change ?? 0) - (a.change ?? 0))[0];
  const share = {
    firstName: user.name?.trim().split(/\s+/)[0] ?? null,
    photoUrl: data.photoUrl,
    streak: data.streak,
    cardsKnown: data.cardsKnown,
    badges: { earned: badges.filter((b) => b.earned).length, total: badges.length },
    skill: best?.change && best.change > 0 ? { label: best.label, change: best.change } : null,
  };
  const steps = stepsFor({ guest, goalSet: prefs.goal !== "unset", submissions: data.submissions, audits: data.audits, cardsKnown: data.cardsKnown });

  const audiences: Audience[] = [
    { who: "Teachers", what: `Your recordings and your ID ${id}, so they can audit you. Never your name, photo, email, number, level or goal.` },
    ...(guest ? [] : [{ who: "Your photo", what: "Only you, on this page. Nobody else is given a link to it." }]),
    ...(data.institute ? [{ who: `${data.institute.name}'s admin`, what: "Your name and email, to manage the institute's members." }] : []),
    { who: "EduSarthi admins", what: "Your account and what you do here, when they help you, check a report or keep the site safe." },
    { who: "The library and share links", what: "Decks you publish or share by a link show only the name you chose in Settings → How your name shows on public decks, or no name. Library decks can be read by anyone, with or without an account, and search engines may list them." },
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
        photoUrl={data.photoUrl}
        roleLine={`${guest ? "Guest" : "Student"} · ${joinedLine(user.createdAt)}`}
        chips={
          <>
            <Badge variant="accent" className="font-mono">{id}</Badge>
            {data.institute ? <Badge>{data.institute.name}</Badge> : null}
          </>
        }
        actions={
          <>
            <EditProfile
              label={user.name ? "Edit profile" : guest ? "Add your name" : "Add name and photo"}
              name={user.name}
              phone={user.phone}
              showPhone={!guest}
              photo={guest ? undefined : { url: data.photoUrl, initials: initialsOf(user.name, user.email), note: `Only you see it. Teachers see you as ${id}.` }}
            />
            <ShareProgress data={share} />
          </>
        }
        note={<>Only you see your name{guest ? "" : " and photo"} here. Teachers see you as <span className="whitespace-nowrap font-mono text-ink">{id}</span>.</>}
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
        todayXp={data.todayXp}
        dailyGoalXp={prefs.dailyGoalXp}
        weekMet={data.weekMet}
        weeklyGoalDays={prefs.weeklyGoalDays}
      />

      <SkillScores scores={data.scores} audits={data.audits} />

      <ActivityCalendar
        title="Practice calendar"
        days={calendarDays(data)}
        today={dayNumberOf(data.today)}
        // Some XP, a streak day, the daily goal, twice the goal.
        levels={[1, STREAK_MIN_XP, prefs.dailyGoalXp, prefs.dailyGoalXp * 2]}
        summary={
          <>
            <b className="font-mono">{yearDays}</b> learning {yearDays === 1 ? "day" : "days"} in the last 12 months · longest streak{" "}
            <b className="font-mono">{data.longest}</b> {data.longest === 1 ? "day" : "days"}
          </>
        }
        note={`A learning day is ${STREAK_MIN_XP} XP or more: a recording is ${XP_RECORDING}, a new card ${XP_NEW_CARD}, a review ${XP_REVIEW}. Darker squares are closer to your daily goal.${user.createdAt.getTime() < CARD_LOG_START ? " Card XP counts from 26 Oct 2026." : ""}`}
        emptyText="No learning days yet. Answer a card or send a recording and today fills in."
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
