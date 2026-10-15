// Owns in-browser capture: microphone (or camera) permission, MediaRecorder,
// a live level meter, and retake.
//
// It deliberately does NOT upload, and it deliberately does not decide what to
// do when recording is impossible. It reports failure upward and SubmitPanel
// falls back to the Uploader — a component that hides its own failure leaves
// the student staring at a dead button.

"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { baseType, extensionFor, pickRecordingType, readDuration } from "@/lib/media";
import { SAVER_BITRATE, SAVER_VIDEO } from "@/lib/dataSaver";

type State = "idle" | "recording" | "done";

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Recorder({
  kind,
  maxSeconds,
  disabled,
  onSelect,
  onUnavailable,
}: {
  kind: "AUDIO" | "VIDEO";
  maxSeconds: number | null;
  disabled?: boolean;
  onSelect: (file: File | null, durationSec: number | null) => void;
  onUnavailable: (reason: string) => void;
}) {
  const [state, setState] = useState<State>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const previewRef = useRef<string | null>(null);

  // Everything here holds an OS-level resource. Without this, the browser's
  // recording indicator stays lit after the student navigates away, and the
  // microphone stays open.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      void audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  // Ticks the clock and enforces the cap. Kept as an effect rather than a
  // setInterval inside start(), so stopping the recorder always stops the
  // timer — an interval left running past a stop is a clock that never resets.
  useEffect(() => {
    if (state !== "recording") return;

    const timer = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        // Hard cap at double the guide. The exercise limit is guidance and
        // should not cut a student off mid-sentence; double it is the point
        // where something has clearly gone wrong.
        if (maxSeconds && next >= maxSeconds * 2) stop();
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, maxSeconds]);

  function meter(stream: MediaStream) {
    // AudioContext, not a fixed animation. The meter has to reflect the actual
    // input, or a student with a muted microphone records two minutes of
    // silence and only finds out when the audit says so.
    const context = new AudioContext();
    audioContextRef.current = context;

    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(data);

      // Peak deviation from the 128 midpoint, normalised. Cheaper than RMS and
      // close enough for a bar that is only telling the user "it hears you".
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128));

      setLevel(Math.min(1, peak / 96));
      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
  }

  async function start() {
    setError(null);

    const mimeType = pickRecordingType(kind);
    if (!mimeType) {
      onUnavailable("This browser cannot record. Upload a file instead.");
      return;
    }

    // Read from <html> at the moment of recording, so a change made in
    // Settings applies to the very next take without a reload.
    const saver = document.documentElement.dataset.saver === "on";

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(
        kind === "VIDEO" ? { audio: true, video: saver ? SAVER_VIDEO : true } : { audio: true },
      );
    } catch (err) {
      // Denial is the common case and is not an error worth logging. The
      // message has to say what to do next, because the browser's own prompt
      // will not appear a second time.
      const denied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "SecurityError");

      onUnavailable(
        denied
          ? "Microphone access was blocked. Allow it in your browser's address bar, or upload a file instead."
          : "No microphone was found. Upload a file instead.",
      );
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream, saver ? { mimeType, ...SAVER_BITRATE } : { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // Tracks are stopped here, not in stop(), because the recorder needs the
      // stream alive until it has flushed its last chunk.
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      void audioContextRef.current?.close();
      audioContextRef.current = null;
      setLevel(0);

      const type = baseType(mimeType);
      const blob = new Blob(chunksRef.current, { type });

      if (blob.size === 0) {
        setError("Nothing was recorded. Try again, or upload a file instead.");
        setState("idle");
        return;
      }

      const file = new File([blob], `recording-${Date.now()}.${extensionFor(type)}`, {
        type,
      });

      const url = URL.createObjectURL(blob);
      previewRef.current = url;
      setPreviewUrl(url);
      setState("done");

      const duration = await readDuration(blob);
      onSelect(file, duration);
    };

    recorder.start();
    meter(stream);
    setElapsed(0);
    setState("recording");
  }

  function retake() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreviewUrl(null);
    setElapsed(0);
    setState("idle");
    onSelect(null, null);
  }

  const overLimit = maxSeconds !== null && elapsed > maxSeconds;

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      {state === "done" && previewUrl ? (
        <div>
          {kind === "VIDEO" ? (
            <video src={previewUrl} controls className="w-full rounded-lg" />
          ) : (
            <audio src={previewUrl} controls className="w-full" />
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-muted">
              {formatClock(elapsed)} recorded. Listen before you send it.
            </p>
            <Button variant="outline" size="sm" onClick={retake} disabled={disabled}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Record again
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p
            className={cn(
              "font-mono text-3xl font-bold",
              overLimit ? "text-error" : "text-ink",
            )}
            // The clock is the one thing a screen reader user needs while
            // recording, and it changes every second — polite, so it is
            // announced between other output rather than cutting across it.
            aria-live="polite"
          >
            {formatClock(elapsed)}
          </p>

          {maxSeconds ? (
            <p className="mt-1 text-xs text-ink-muted">
              {overLimit
                ? `Over the ${maxSeconds}s guide — wrap up.`
                : `Aim for about ${maxSeconds}s.`}
            </p>
          ) : null}

          <div
            className="mx-auto mt-5 h-2 w-48 overflow-hidden rounded-full bg-paper-dim"
            role="img"
            aria-label={
              state === "recording"
                ? level > 0.05
                  ? "Microphone is picking up sound"
                  : "No sound detected"
                : "Input level"
            }
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-75"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </div>

          {state === "recording" && level < 0.03 && elapsed > 3 ? (
            <p aria-live="polite" className="mt-2 text-xs text-error">
              No sound is reaching the microphone. Check it is not muted.
            </p>
          ) : null}

          <div className="mt-6">
            {state === "recording" ? (
              <Button onClick={stop} disabled={disabled}>
                <Square className="h-4 w-4" aria-hidden="true" />
                Stop
              </Button>
            ) : (
              <Button onClick={() => void start()} disabled={disabled}>
                <Mic className="h-4 w-4" aria-hidden="true" />
                Start recording
              </Button>
            )}
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" aria-live="assertive" className="mt-3 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
