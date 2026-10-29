// Owns the wiring between the audit's player and every note list on the page:
// a provider holding the player's seek function, the player that fills it, and
// a note list that uses it. "Fix these first" sits above the player and the
// full list below it, so the seek has to be shared rather than passed down.
//
// It deliberately renders no scores or text of its own. The report around it
// stays a server component; these are the smallest pieces that need the
// browser. NoteList and Player are reused unchanged, because the teacher's
// page uses them too.

"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import type { MediaKind } from "@prisma/client";

import { Player } from "@/components/media/Player";
import { NoteList } from "@/components/review/NoteList";
import type { NoteInput } from "@/lib/validations";

const SeekContext = createContext<{
  seekRef: React.RefObject<((seconds: number) => void) | null>;
  boxRef: React.RefObject<HTMLDivElement | null>;
} | null>(null);

export function AuditSeekProvider({ children }: { children: ReactNode }) {
  const seekRef = useRef<((seconds: number) => void) | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  return <SeekContext.Provider value={{ seekRef, boxRef }}>{children}</SeekContext.Provider>;
}

function reducedMotion(): boolean {
  return (
    document.documentElement.dataset.motion === "reduce" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useSeek(): (seconds: number) => void {
  const ctx = useContext(SeekContext);
  const seek = useCallback(
    (seconds: number) => {
      const box = ctx?.boxRef.current;
      if (box) {
        // "Fix these first" sits above the player. Before the player has
        // stuck to the top, pressing a time there would start audio the
        // student cannot see or pause, so bring the player into view first.
        const r = box.getBoundingClientRect();
        if (r.bottom > window.innerHeight || r.top < 0) {
          box.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
        }
      }
      ctx?.seekRef.current?.(seconds);
    },
    [ctx],
  );
  return seek;
}

export function AuditPlayer({
  src,
  kind,
  autoPlay,
  playbackRate,
}: {
  src: string;
  kind: MediaKind;
  autoPlay: boolean;
  playbackRate: number;
}) {
  const ctx = useContext(SeekContext);
  return (
    // Sticky under the header on a phone; on a computer the whole column is
    // sticky instead (see AuditReport), so the player stays put there too.
    <div
      ref={ctx?.boxRef}
      className="sticky top-14 z-30 -mx-4 bg-paper/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0 lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
    >
      <Player
        src={src}
        kind={kind === "VIDEO" ? "VIDEO" : "AUDIO"}
        showSpeed
        initialRate={playbackRate}
        onReady={(seekTo) => {
          if (ctx) ctx.seekRef.current = seekTo;
          if (autoPlay) seekTo(0);
        }}
      />
    </div>
  );
}

/// `playable` is false when there is no recording to jump into (a photo, or a
/// file removed under the retention policy): the times then show as plain
/// text rather than buttons that do nothing.
export function SeekNotes({ notes, playable }: { notes: readonly NoteInput[]; playable: boolean }) {
  const seek = useSeek();
  // No onRemove: a student cannot edit their own audit.
  return <NoteList notes={notes} onSeek={playable ? seek : undefined} />;
}
