// Owns the shell for pages a signed-out visitor can read: about, support and
// the legal pages.
//
// It deliberately does not use StickyHeader. That header carries a settings
// menu with a sign-out button, which is wrong for someone who is not signed in
// — and these pages are readable either way.

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-nav-bg">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <Link
            href="/"
            className="font-display text-lg font-bold text-brand hover:text-accent"
          >
            EduSarthi
          </Link>
          <div className="ml-auto">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
