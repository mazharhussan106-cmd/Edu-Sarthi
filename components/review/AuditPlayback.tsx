// Owns the student's side of an audit: the player and the note list, wired so
// that pressing a timestamp seeks the recording and starts it.
//
// The player is sticky on purpose. On a phone the notes run below the fold;
// without it, pressing "0:42" starts audio in a player the student can no
// longer see or pause.
//
// It exists because that wiring needs a shared ref, which needs a client
// component — and the feedback page is a server component that reads the
// database. The scores, the summary and the page shell stay on the server.

"use client";

import { useRef } from "react";
import type { MediaKind } from "@prisma/client";

import { Card, CardTitle } from "@/components/ui/Card";
import { Player } from "@/components/media/Player";
import { NoteList } from "@/components/review/NoteList";
import type { NoteInput } from "@/lib/validations";

export function AuditPlayback({
  mediaUrl,
  mediaKind,
  notes,
  autoPlay = false,
}: {
  mediaUrl: string;
  mediaKind: MediaKind;
  notes: readonly NoteInput[];
  autoPlay?: boolean;
}) {
  const seekRef = useRef<((seconds: number) => void) | null>(null);

  return (
    <div className="mt-4">
      {/* top-14 sits it directly under the sticky header. */}
      <div className="sticky top-14 z-30 -mx-4 bg-paper/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
        <Player
          src={mediaUrl}
          kind={mediaKind === "VIDEO" ? "VIDEO" : "AUDIO"}
          showSpeed
          onReady={(seekTo) => {
            seekRef.current = seekTo;
            if (autoPlay) seekTo(0);
          }}
        />
      </div>

      {notes.length > 0 ? (
        <Card className="mt-3">
          <CardTitle>Where to improve</CardTitle>
          <p className="mt-1 text-xs text-ink-muted">
            Press a time to hear that moment again.
          </p>
          <div className="mt-3">
            {/* No onRemove: a student cannot edit their own audit. */}
            <NoteList notes={notes} onSeek={(at) => seekRef.current?.(at)} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
