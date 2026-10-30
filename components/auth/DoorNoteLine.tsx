// Owns drawing DoorNote's line and putting it away: the cookie is cleared as
// soon as the line shows, so it appears once, and "Got it" hides it now.
//
// It deliberately decides nothing about who sees it; DoorNote does.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { clearStudentDoor } from "@/components/auth/doorCookie";

export function DoorNoteLine({ path, who }: { path: string; who: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => clearStudentDoor(), []);
  if (!open) return null;
  return (
    <div className="px-4 pt-3">
    <div role="status" className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-lg border border-border-strong bg-surface px-4 py-2 text-sm text-ink">
      <p>
        You signed in on the student page. {who} have their own:{" "}
        <Link href={path} className="font-medium text-accent hover:underline">
          {path}
        </Link>
      </p>
      <button type="button" onClick={() => setOpen(false)} className="shrink-0 rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-hover">
        Got it
      </button>
    </div>
    </div>
  );
}
