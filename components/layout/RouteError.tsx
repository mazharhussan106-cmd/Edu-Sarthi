// Owns what a page shows when it throws while loading: what happened in plain
// words, a Try again button, and a way out. The error itself is logged for the
// owner and never shown to the visitor — a stack trace tells them nothing.
//
// It deliberately does not know which page failed; every route group's
// error.tsx renders this one component.

"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

export function RouteError({ error, retry, home = "/" }: { error: Error & { digest?: string }; retry: () => void; home?: string }) {
  useEffect(() => {
    // The digest ties this to the server log line, so the owner can find it.
    console.error("Page error", error.digest ?? "", error.message);
  }, [error]);

  return (
    <main role="alert" className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-xl font-bold text-ink">This page did not load</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Something went wrong on our side, or your connection dropped. Nothing you did was lost. Try again; if it keeps happening, go back
        and open it from there, or tell support what you were doing.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={retry}>Try again</Button>
        <Link href={home} className="inline-flex h-10 items-center rounded-lg border border-border-strong px-4 text-sm text-ink hover:bg-hover">
          Go back home
        </Link>
      </div>
    </main>
  );
}
