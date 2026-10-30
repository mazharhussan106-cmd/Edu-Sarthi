// Owns a teacher's Profile: who they are (with the Verified teacher mark),
// their reviewing numbers and calendar, the quality notes an admin left on
// their audits, their decks, shortcuts and account and privacy.
//
// Quality notes are shown to the teacher who wrote the audit (owner's
// decision, 29 Oct 2026); before that only admins saw them. It deliberately
// shows no student's name: students are anonymous IDs to teachers.

import { BadgeCheck, BookOpen, CalendarCheck, Clock, Gauge, GraduationCap, Inbox, Settings, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { AccountRows, type Audience } from "@/components/profile/AccountRows";
import { ActivityCalendar } from "@/components/profile/ActivityCalendar";
import { EditProfile } from "@/components/profile/EditProfile";
import { IdentityCard, initialsOf, joinedLine } from "@/components/profile/IdentityCard";
import { LinkRow, RowGroup, StatTiles } from "@/components/profile/ProfileParts";
import { todayNumber } from "@/lib/profileStats";
import type { QaNote, teacherProfile } from "@/lib/staffProfileStats";

type Data = NonNullable<Awaited<ReturnType<typeof teacherProfile>>>;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const dateIn = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

function turnaround(hours: number | null): string {
  if (hours === null) return "–";
  if (hours < 1) return "<1 h";
  return hours < 48 ? `${Math.round(hours)} h` : `${Math.round(hours / 24)} d`;
}

function QualityChecks({ notes }: { notes: QaNote[] }) {
  return (
    <Card className="p-4 sm:p-5">
      <CardTitle>Quality checks</CardTitle>
      <p className="mt-2 text-sm text-ink">
        {notes.length === 0
          ? "None of your audits was marked for a second look in the last 90 days."
          : `${plural(notes.length, "audit")} marked for a second look in the last 90 days.`}
      </p>
      {notes.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {notes.map((n, i) => (
            <li key={i} className="rounded-lg bg-paper-dim px-3 py-2 text-xs">
              <p className="font-medium text-ink">
                “{n.exercise}”, sent {dateIn(n.recorded)}
              </p>
              <p className="mt-0.5 text-ink-muted">
                Marked {dateIn(n.date)}: {n.note || "No note was left."}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs text-ink-muted">An admin marks an audit to check it again. Only you and the admins see these notes.</p>
    </Card>
  );
}

export function TeacherProfile({ data }: { data: Data }) {
  const { user, decks } = data;
  const audiences: Audience[] = [
    { who: "Students", what: "Not your name, photo, email or number. Audits do not say who wrote them." },
    { who: "Anyone who opens the library", what: "On decks you publish: the name you chose in Settings → How your name shows on public decks, and Verified teacher if you are. Library decks can be read with or without an account, and search engines may list them." },
    ...(user.institute ? [{ who: `${user.institute.name}'s admin`, what: "Your name and email, to manage the institute's members." }] : []),
    { who: "EduSarthi admins", what: "Your account, the audits you wrote and their quality notes, to check quality and help you." },
  ];

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-2 md:items-start">
      <IdentityCard
        name={user.name}
        initials={initialsOf(user.name, user.email)}
        photoUrl={user.photoUrl}
        roleLine={`Teacher · ${joinedLine(user.createdAt)}`}
        chips={
          <>
            {user.teacherVerifiedAt ? <Badge variant="success">Verified teacher</Badge> : <Badge>Not verified yet</Badge>}
            {user.institute ? <Badge>{user.institute.name}</Badge> : null}
          </>
        }
        actions={
          <EditProfile
            label={user.name ? "Edit profile" : "Add name and photo"}
            name={user.name}
            phone={user.phone}
            showPhone
            photo={{ url: user.photoUrl, initials: initialsOf(user.name, user.email), note: "Only you see it, on this page." }}
          />
        }
        note={
          user.teacherVerifiedAt
            ? "Students do not see your name on their audits."
            : "An admin verifies teachers. Until then you can audit, but not submit decks to the library."
        }
      />

      <StatTiles
        label="Your reviewing"
        tiles={[
          { icon: BadgeCheck, value: data.written, label: "Audits written" },
          { icon: CalendarCheck, value: data.thisMonth, label: "This month" },
          { icon: Users, value: data.studentsHelped, label: "Students helped" },
          { icon: Clock, value: turnaround(data.turnaroundHours), label: "Turnaround · 30 days" },
        ]}
      />

      <ActivityCalendar
        title="Reviewing calendar"
        days={[...data.days.entries()].map(([day, n]) => ({ day, score: n, text: plural(n, "audit") }))}
        today={todayNumber()}
        levels={[1, 3, 6, 10]}
        summary={
          <>
            <b className="font-mono">{data.days.size}</b> {data.days.size === 1 ? "day" : "days"} with audits in the last 13 months
          </>
        }
        note="Turnaround is the median time from a recording being sent to your audit, over the last 30 days, as on Workload."
        legend={["Fewer", "More audits"]}
        emptyText="No audits yet. Your first one fills in today's square."
      />

      <QualityChecks notes={data.qa} />

      <RowGroup id="my-content" title="My content">
        <LinkRow href="/decks" icon={BookOpen} title="My teaching decks" subline={`${plural(decks.owned, "deck")} · ${decks.inLibrary} in the library`} />
        <LinkRow href="/decks" icon={Users} title="Learners following" subline={`${decks.followers === 1 ? "1 learner follows" : `${decks.followers} learners follow`} your decks`} />
      </RowGroup>

      <RowGroup id="shortcuts" title="Shortcuts">
        <LinkRow href="/queue" icon={Inbox} title="Queue" subline="Recordings waiting for an audit" value={`${data.waiting} waiting`} />
        <LinkRow href="/students" icon={GraduationCap} title="My students" subline="Everyone who has sent a recording" />
        <LinkRow href="/workload" icon={Gauge} title="Workload" subline="Audits per day, turnaround, send-backs" />
        <LinkRow href="/settings" icon={Settings} title="Settings" subline="Queue emails, theme, password" />
      </RowGroup>

      <AccountRows email={user.email} emailVerified={user.emailVerified} phone={user.phone} audiences={audiences} canDelete={false} closedBySupport />
    </main>
  );
}
