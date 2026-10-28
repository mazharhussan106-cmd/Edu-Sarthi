// Owns playback for audio and video, with a seekable progress bar and a
// current-time callback.
//
// The callback is why this replaces a plain <audio controls>: the teacher's
// note form needs to know where playback is, and the review page needs to be
// able to jump to a note's timestamp. Native controls expose neither.
//
// It deliberately does NOT render notes. It exposes a seek function through a
// callback and lets the parent decide what to do with time.

"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { PLAYBACK_RATES } from "@/lib/preferences";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Player({
  src,
  kind,
  onTimeUpdate,
  onReady,
  showSpeed = false,
  initialRate = 1,
  className,
}: {
  src: string;
  kind: "AUDIO" | "VIDEO";
  /// Fired continuously while playing. The parent uses it to stamp a note.
  onTimeUpdate?: (seconds: number) => void;
  /// Handed a seek function once the element exists, so the parent can jump to
  /// a timestamp without holding a ref into this component's internals.
  onReady?: (seekTo: (seconds: number) => void) => void;
  /// Adds 1x / 1.25x / 1.5x. The student side wants it for re-listening to
  /// their own answer; the teacher's form does not.
  showSpeed?: boolean;
  /// The speed to start at: the student's "Audit playback speed" setting.
  initialRate?: number;
  className?: string;
}) {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const [rate, setRate] = useState(initialRate);

  // Metadata can arrive before hydration, while onLoadedMetadata is not yet
  // listening (a slow phone, a cached file). A source already loaded by then
  // gets its length and starting speed here instead.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || el.readyState < 1) return;
    setDuration(el.duration);
    el.playbackRate = initialRate;
    // Once per mounted element, like the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !onReady) return;

    onReady((seconds) => {
      el.currentTime = seconds;
      setCurrent(seconds);
      // Pressing a note's time means "let me hear that", so it plays rather
      // than leaving the student to find the play button as well.
      void el.play().catch(() => undefined);
    });
    // Runs once per mounted element. onReady in the dependency list would
    // re-fire on every parent render unless the parent memoised it, which is a
    // trap to leave lying around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTimeUpdate() {
    const el = mediaRef.current;
    if (!el) return;

    setCurrent(el.currentTime);
    onTimeUpdate?.(el.currentTime);
  }

  function toggle() {
    const el = mediaRef.current;
    if (!el) return;

    if (el.paused) {
      // play() rejects when the browser blocks autoplay or the source is bad.
      // Unhandled, it surfaces as an uncaught promise rejection in the console
      // and nothing at all in the UI.
      void el.play().catch(() => setFailed(true));
    } else {
      el.pause();
    }
  }

  if (failed) {
    return (
      <div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
        <p className="text-sm text-ink-muted">
          This recording could not be played. Reload the page — the link may
          have expired.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg bg-player-bg p-4", className)}>
      {/* One element for both kinds. A <video> with no height renders as an
          audio player, and splitting them would mean two sets of handlers. */}
      <video
        ref={mediaRef}
        src={src}
        className={cn("w-full rounded-lg", kind === "AUDIO" && "hidden")}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          // Set here, not on mount: loading a source resets the element to its
          // default speed, which would quietly undo a rate set any earlier.
          e.currentTarget.playbackRate = rate;
        }}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
        playsInline
      />

      <div className={cn("flex items-center gap-3", kind === "VIDEO" && "mt-3")}>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            const el = mediaRef.current;
            if (el) el.currentTime = Math.max(0, el.currentTime - 5);
          }}
          aria-label="Back 5 seconds"
          className="shrink-0 text-player-text hover:text-accent"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* A range input, not a styled div. Dragging, arrow keys, Home and End
            all work without a single keydown handler. */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(e) => {
            const el = mediaRef.current;
            const next = Number(e.target.value);
            if (el) el.currentTime = next;
            setCurrent(next);
          }}
          aria-label="Playback position"
          aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
          className="w-full accent-[var(--color-accent)]"
        />

        <span className="shrink-0 font-mono text-xs text-player-text">
          {formatTime(current)} / {formatTime(duration)}
        </span>
      </div>

      {showSpeed ? (
        <div className="mt-2 flex items-center justify-end gap-1" role="group" aria-label="Playback speed">
          {PLAYBACK_RATES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={rate === r}
              onClick={() => {
                const el = mediaRef.current;
                if (el) el.playbackRate = r;
                setRate(r);
              }}
              className={cn(
                "rounded-md px-2 py-0.5 font-mono text-xs",
                rate === r ? "bg-accent text-on-accent" : "text-player-text hover:text-accent",
              )}
            >
              {r}x
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
