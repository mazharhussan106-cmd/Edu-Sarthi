// Owns the header a signed-out visitor sees: the brand, a Library link and
// Sign in. Shared by the public pages (about, support, legal) and by the
// library pages when nobody is signed in.
//
// It deliberately does not use StickyHeader. That header carries a settings
// menu with a sign-out button, which is wrong for someone who is not signed
// in. The landing page keeps its own header, which also has "Get started".

import Link from "next/link";

import { Button } from "@/components/ui/Button";

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-nav-bg">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
        <Link
          href="/"
          className="font-display text-lg font-bold text-brand hover:text-accent"
        >
          EduSarthi
        </Link>
        <nav aria-label="Public" className="ml-auto flex items-center gap-1">
          <Link
            href="/library"
            className="rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-hover hover:text-ink"
          >
            Library
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
