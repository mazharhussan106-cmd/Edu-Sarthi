// Owns the shell every auth page renders into: the narrow container and the
// SessionProvider.
//
// SessionProvider is here and not in the root layout because only /verify
// needs it — it calls update() to refresh a JWT that still says unverified.
// Mounting it app-wide would add a client boundary to every server page for
// the benefit of one.

import { SessionProvider } from "next-auth/react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <main className="mx-auto max-w-sm px-6 py-16">
        <Link
          href="/"
          className="font-display text-xl font-bold text-brand hover:text-accent"
        >
          EduSarthi
        </Link>
        <div className="mt-8">{children}</div>
      </main>
    </SessionProvider>
  );
}
