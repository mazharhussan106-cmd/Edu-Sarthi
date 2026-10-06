// Owns one media slot on the card editor (a picture or a recording): showing
// what is attached, choosing a replacement, and removing it.
//
// It reuses the Recorder and Uploader the submission flow already has, so the
// microphone and file handling are not written twice. It deliberately does NOT
// upload — it hands the chosen File up and the editor uploads on Save, so
// nothing is stored for a card that is never saved.

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Recorder } from "@/components/media/Recorder";
import { Uploader } from "@/components/media/Uploader";
import { DECK_LIMITS } from "@/lib/deckSchemas";

export function MediaField({
  kind,
  existingSrc,
  onChange,
  disabled,
}: {
  kind: "IMAGE" | "AUDIO";
  /// Signed URL of the file already on the card, if any.
  existingSrc: string | null;
  /// keep: leave the file already on the card as it is. file: a new choice.
  /// Neither: the slot is cleared.
  onChange: (change: { file: File | null; keep: boolean }) => void;
  disabled?: boolean;
}) {
  const [keep, setKeep] = useState(Boolean(existingSrc));
  const [recordFailed, setRecordFailed] = useState(false);
  const [mode, setMode] = useState<"record" | "upload">(kind === "AUDIO" ? "record" : "upload");
  const label = kind === "IMAGE" ? "picture" : "recording";

  function pick(file: File | null, duration: number | null) {
    if (file && kind === "AUDIO" && duration !== null && duration > DECK_LIMITS.audioSeconds) {
      alert(`That recording is ${duration} seconds. Keep it under ${DECK_LIMITS.audioSeconds} seconds.`);
      onChange({ file: null, keep: false });
      return;
    }
    onChange({ file, keep: false });
  }

  if (keep && existingSrc) {
    return (
      <div className="flex flex-col gap-2">
        {kind === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
          <img src={existingSrc} alt="Current picture on this card" className="max-h-40 rounded-lg border border-border object-contain" />
        ) : (
          <audio controls src={existingSrc} className="w-full" aria-label="Current recording" />
        )}
        <div>
          <Button variant="outline" size="sm" disabled={disabled} onClick={() => { setKeep(false); onChange({ file: null, keep: false }); }}>
            Replace or remove {label}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {kind === "AUDIO" && !recordFailed ? (
        <div className="flex gap-2" role="group" aria-label="How to add a recording">
          <Button variant={mode === "record" ? "primary" : "outline"} size="sm" onClick={() => setMode("record")}>Record</Button>
          <Button variant={mode === "upload" ? "primary" : "outline"} size="sm" onClick={() => setMode("upload")}>Upload a file</Button>
        </div>
      ) : null}
      {kind === "AUDIO" && mode === "record" && !recordFailed ? (
        <Recorder kind="AUDIO" maxSeconds={DECK_LIMITS.audioSeconds} disabled={disabled} onSelect={pick} onUnavailable={() => { setRecordFailed(true); setMode("upload"); }} />
      ) : (
        <Uploader expects={kind} maxBytes={kind === "IMAGE" ? DECK_LIMITS.imageBytes : DECK_LIMITS.audioBytes} disabled={disabled} onSelect={pick} />
      )}
      {existingSrc ? (
        <div>
          <Button variant="ghost" size="sm" onClick={() => { setKeep(true); onChange({ file: null, keep: true }); }}>Keep the current {label}</Button>
        </div>
      ) : null}
    </div>
  );
}
