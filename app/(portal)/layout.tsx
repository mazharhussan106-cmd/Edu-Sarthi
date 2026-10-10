// Owns the shell shared by the three sign-in doors: just the SessionProvider.
//
// The look of each door is not here — PortalShell draws it per door, because a
// layout cannot know which door it is wrapping. This group is separate from
// (auth) because those pages sit in a narrow centred column and these need the
// full screen for their own backgrounds.

import { SessionProvider } from "next-auth/react";

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SessionProvider>{children}</SessionProvider>;
}
