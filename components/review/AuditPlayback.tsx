// Owns the student's side of an audit: the player and the note list, wired so
// that pressing a timestamp seeks the recording.
//
// It exists because that wiring needs a shared ref, which needs a client
// component — and the feedback page is a server component that reads the
// database. This is the smallest possible client boundary: the scores, the
// summary and the page shell all stay on the server.

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
}: {
  mediaUrl: string;
  mediaKind: MediaKind;
  notes: readonly NoteInput[];
}) {
  const seekRef = useRef<((seconds: number) => void) | null>(null);

  return (
    <>
      <Card className="mt-4">
        <CardTitle>Your submission</CardTitle>
        <div className="mt-3">
          {/* No onTimeUpdate: the student has nothing to stamp, so subscribing
              to a callback that fires several times a second would cost
              renders for nothing. */}
          <Player
            src={mediaUrl}
            kind={mediaKind === "VIDEO" ? "VIDEO" : "AUDIO"}
            onReady={(seekTo) => {
              seekRef.current = seekTo;
            }}
          />
        </div>
      </Card>

      {notes.length > 0 ? (
        <Card className="mt-4">
          <CardTitle>Notes</CardTitle>
          <p className="mt-1 text-xs text-ink-muted">
            Press a time to hear that moment again.
          </p>
          <div className="mt-3">
            {/* No onRemove: a student cannot edit their own audit. */}
            <NoteList notes={notes} onSeek={(at) => seekRef.current?.(at)} />
          </div>
        </Card>
      ) : null}
    </>
  );
}
