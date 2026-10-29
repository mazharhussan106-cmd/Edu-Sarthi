// Owns the Profile for teachers and admins: who they are, the work they have
// done here, shortcuts to their own pages, and account and privacy.
//
// It deliberately keeps students out of it. A teacher's profile counts their
// audits, never shows a student's name, and admin numbers are this admin's
// own actions, not the site's totals (those are on Admin → Overview).

import { BadgeCheck, Settings } from "lucide-react";
import type { Role } from "@prisma/client";

import { Badge } from "@/components/ui/Badge";
import { AccountRows, type Audience } from "@/components/profile/AccountRows";
import { EditProfile } from "@/components/profile/EditProfile";
import { IdentityCard, initialsOf, joinedLine } from "@/components/profile/IdentityCard";
import { LinkRow, RowGroup, StatTiles } from "@/components/profile/ProfileParts";
import { prisma } from "@/lib/prisma";

export async function StaffProfile({ userId, role }: { userId: string; role: Role }) {
  const [user, auditsWritten] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, createdAt: true, emailVerified: true, teacherVerifiedAt: true },
    }),
    prisma.feedback.count({ where: { teacherId: userId } }),
  ]);
  if (!user) return null;
  const admin = role === "ADMIN";

  const audiences: Audience[] = [
    { who: "Students", what: "Not your name, email or number. Audits do not say who wrote them." },
    { who: "Learners in the library", what: "The name you chose in Settings → How your name shows on public decks, on decks you publish." },
    { who: "EduSarthi admins", what: "Your account and the audits you wrote, to check quality and help you." },
  ];

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-2 md:items-start">
      <IdentityCard
        name={user.name}
        initials={initialsOf(user.name, user.email)}
        roleLine={`${admin ? "Administrator" : "Teacher"} · ${joinedLine(user.createdAt)}`}
        chips={
          admin ? (
            <Badge variant="accent">Administrator</Badge>
          ) : user.teacherVerifiedAt ? (
            <Badge variant="success">Verified teacher</Badge>
          ) : (
            <Badge>Not verified yet</Badge>
          )
        }
        actions={<EditProfile label={user.name ? "Edit profile" : "Add your name"} name={user.name} phone={user.phone} showPhone />}
      />
      <StatTiles label="Your reviewing" tiles={[{ icon: BadgeCheck, value: auditsWritten, label: "Audits written" }]} />
      <RowGroup id="shortcuts" title="Shortcuts">
        <LinkRow href="/settings" icon={Settings} title="Settings" subline="Queue emails, theme, password" />
      </RowGroup>
      <AccountRows email={user.email} emailVerified={user.emailVerified} phone={user.phone} audiences={audiences} canDelete={false} closedBySupport />
    </main>
  );
}
