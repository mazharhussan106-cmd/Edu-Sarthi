// Owns the card at the top of every Profile: the photo (initials when there
// is none), the name, the role and join month, small chips (STU ID,
// institute, verified teacher), the action buttons and one privacy line.
//
// It deliberately takes chips, actions and the note as ready-made pieces, so
// the student, teacher and admin pages decide what they say and this card
// only decides where it goes.

import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";

export function initialsOf(name: string | null, email: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (words[0]?.[0] ?? email?.trim()[0] ?? "?").toUpperCase();
}

export function IdentityCard({
  name,
  initials,
  photoUrl,
  roleLine,
  chips,
  actions,
  note,
}: {
  /** null shows "No name yet", so a student signed in by code sees what is missing. */
  name: string | null;
  initials: string;
  /** A signed URL for the owner's own photo; never passed for anyone else. */
  photoUrl?: string | null;
  roleLine: string;
  chips?: ReactNode;
  actions?: ReactNode;
  note?: ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Your profile photo" className="h-[72px] w-[72px] shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-accent/12 font-display text-2xl font-bold text-accent-dark">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className={name ? "truncate font-display text-xl font-bold text-ink" : "font-display text-xl font-bold text-ink-muted"}>
            {name ?? "No name yet"}
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">{roleLine}</p>
          {chips ? <div className="mt-2 flex flex-wrap gap-1.5">{chips}</div> : null}
        </div>
      </div>
      {actions ? <div className="mt-4 flex gap-2 [&>*]:flex-1">{actions}</div> : null}
      {note ? <p className="mt-3 rounded-lg bg-paper-dim px-3 py-2 text-xs text-ink-muted">{note}</p> : null}
    </Card>
  );
}

/// "joined Oct 2026", in India's calendar like every other date here.
export function joinedLine(d: Date): string {
  return `joined ${d.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}`;
}
