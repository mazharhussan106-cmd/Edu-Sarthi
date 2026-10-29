// Owns an admin's Profile: who they are, their own work this week (actions,
// decks reviewed) beside what is waiting for any admin, their last few
// actions in plain words, an activity calendar, shortcuts and account.
//
// It deliberately shows this admin's own work, not the site's totals: those
// are on Admin → Overview, one tap away.

import { BookOpen, ImageIcon, Inbox, KeyRound, LayoutDashboard, ListChecks, SlidersHorizontal, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { AccountRows, type Audience } from "@/components/profile/AccountRows";
import { ActivityCalendar } from "@/components/profile/ActivityCalendar";
import { EditProfile } from "@/components/profile/EditProfile";
import { IdentityCard, initialsOf, joinedLine } from "@/components/profile/IdentityCard";
import { LinkRow, RowGroup, StatTiles } from "@/components/profile/ProfileParts";
import { todayNumber } from "@/lib/profileStats";
import type { adminProfile } from "@/lib/staffProfileStats";

type Data = NonNullable<Awaited<ReturnType<typeof adminProfile>>>;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function ago(d: Date, now = Date.now()): string {
  const h = Math.floor((now - d.getTime()) / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export function AdminProfile({ data }: { data: Data }) {
  const { user } = data;
  const audiences: Audience[] = [
    { who: "Students and teachers", what: "Not your name, photo, email or number. Notices and announcements come from EduSarthi." },
    { who: "Other admins", what: "Your account, and what you did in the admin pages, in the admin log." },
  ];

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-2 md:items-start">
      <IdentityCard
        name={user.name}
        initials={initialsOf(user.name, user.email)}
        photoUrl={user.photoUrl}
        roleLine={`Administrator · ${joinedLine(user.createdAt)}`}
        chips={<Badge variant="accent">Administrator</Badge>}
        actions={
          <EditProfile
            label={user.name ? "Edit profile" : "Add name and photo"}
            name={user.name}
            phone={user.phone}
            showPhone
            photo={{ url: user.photoUrl, initials: initialsOf(user.name, user.email), note: "Only you see it, on this page." }}
          />
        }
      />

      <StatTiles
        label="Your admin work"
        tiles={[
          { icon: ListChecks, value: data.actionsThisWeek, label: "Actions · 7 days" },
          { icon: BookOpen, value: data.reviewed, label: "Decks reviewed · 30 days" },
          { icon: Inbox, value: data.decksWaiting, label: "Decks waiting", highlight: data.decksWaiting > 0 },
          { icon: ImageIcon, value: data.logosWaiting, label: "Logos waiting", highlight: data.logosWaiting > 0 },
        ]}
      />

      <Card className="p-4 sm:p-5">
        <CardTitle>Your recent actions</CardTitle>
        {data.recent.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nothing yet. What you approve, change or send shows here.</p>
        ) : (
          <ul className="mt-2 divide-y divide-dashed divide-border">
            {data.recent.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 text-ink">{a.action}</span>
                <time dateTime={a.createdAt.toISOString()} className="shrink-0 text-xs text-ink-muted">
                  {ago(a.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ActivityCalendar
        title="Activity calendar"
        days={[...data.days.entries()].map(([day, n]) => ({ day, score: n, text: plural(n, "action") }))}
        today={todayNumber()}
        levels={[1, 3, 8, 15]}
        summary={
          <>
            <b className="font-mono">{data.days.size}</b> {data.days.size === 1 ? "day" : "days"} with admin actions in the last 13 months
          </>
        }
        legend={["Fewer", "More actions"]}
        emptyText="No admin actions yet."
      />

      <RowGroup id="shortcuts" title="Shortcuts">
        <LinkRow href="/admin" icon={LayoutDashboard} title="Overview" subline="Queue health, activity and the admin log" />
        <LinkRow href="/admin/decks" icon={BookOpen} title="Decks to review" subline="New decks, versions, reports and small fixes" value={data.decksWaiting ? String(data.decksWaiting) : undefined} />
        <LinkRow href="/admin/users" icon={Users} title="Users" subline="Roles, suspensions and display names" />
        <LinkRow href="/admin/settings" icon={SlidersHorizontal} title="Site settings" subline="Limits and switches for everyone" />
      </RowGroup>

      <AccountRows email={user.email} emailVerified={user.emailVerified} phone={user.phone} audiences={audiences} canDelete={false} closedBySupport>
        <LinkRow href="/settings" icon={KeyRound} title="Password and sign-out" subline="In Settings → Account & security" />
      </AccountRows>
    </main>
  );
}
