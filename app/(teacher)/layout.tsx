// Owns the shell for every teacher page. Same structure as the student layout,
// different links — which is the point of the route groups: navigation differs
// structurally, not by hiding items from a shared list.

import { ensureActiveUser } from "@/lib/activeUser";
import { DoorNote } from "@/components/auth/DoorNote";
import { Footer } from "@/components/layout/Footer";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { auth } from "@/lib/auth";
import { staffNav } from "@/lib/staffNav";

export default async function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await ensureActiveUser(["TEACHER", "ADMIN"]);
  const session = await auth();
  const nav = staffNav(session?.user?.role);

  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader links={nav.links} homeHref={nav.home} />
      <DoorNote role={session?.user?.role} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
