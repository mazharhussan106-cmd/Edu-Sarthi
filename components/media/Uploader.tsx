// Owns picking a file: click, drag-drop, type and size checks, and a preview.
//
// It deliberately does NOT upload. It hands the chosen File up to SubmitPanel,
// which owns the network work — so the upload flow exists once and is shared
// with the Recorder rather than written twice.

"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import type { MediaKind } from "@prisma/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { formatBytes, readDuration } from "@/lib/media";

const ACCEPT: Record<MediaKind, string> = {
  AUDIO: "audio/*",
  VIDEO: "video/*",
  IMAGE: "image/*",
};

const WORD: Record<MediaKind, string> = {
  AUDIO: "audio file",
  VIDEO: "video file",
  IMAGE: "photo",
};

export function Uploader({
  expects,
  maxBytes,
  disabled,
  onSelect,
}: {
  expects: MediaKind;
  maxBytes: number;
  disabled?: boolean;
  onSelect: (file: File | null, durationSec: number | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);

  async function accept(chosen: File) {
    setError(null);

    // Checked before anything else. Reading the duration of a 400 MB video
    // means loading it, and the answer does not matter if it is being rejected.
    if (chosen.size > maxBytes) {
      setError(
        `That file is ${formatBytes(chosen.size)}. The limit is ${formatBytes(maxBytes)}.`,
      );
      return;
    }

    const prefix = expects.toLowerCase();
    if (!chosen.type.startsWith(prefix === "image" ? "image" : prefix)) {
      setError(`This exercise needs ${WORD[expects]}. That file is not one.`);
      return;
    }

    setReading(true);
    const duration = await readDuration(chosen);
    setReading(false);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(chosen);
    setPreviewUrl(URL.createObjectURL(chosen));
    onSelect(chosen, duration);
  }

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    onSelect(null, null);
    // Resetting the input's value matters: without it, choosing the same file
    // again fires no change event and nothing happens.
    if (inputRef.current) inputRef.current.value = "";
  }

  if (file && previewUrl) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        {expects === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="What you are about to submit"
            className="max-h-80 w-full rounded-lg object-contain"
          />
        ) : expects === "VIDEO" ? (
          <video src={previewUrl} controls className="w-full rounded-lg" />
        ) : (
          <audio src={previewUrl} controls className="w-full" />
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs text-ink-muted">
            {file.name} · {formatBytes(file.size)}
          </p>
          <Button variant="ghost" size="sm" onClick={clear} disabled={disabled}>
            <X className="h-4 w-4" aria-hidden="true" />
            Choose another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) void accept(dropped);
        }}
        className={cn(
          "rounded-lg border border-dashed p-8 text-center transition-colors",
          dragging ? "border-accent bg-hover" : "border-border-strong",
        )}
      >
        <Upload className="mx-auto h-6 w-6 text-ink-muted" aria-hidden="true" />
        <p className="mt-3 text-sm text-ink">
          Drop {WORD[expects]} here, or choose one
        </p>
        <p className="mt-1 text-xs text-ink-muted">Up to {formatBytes(maxBytes)}</p>

        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={disabled || reading}
          onClick={() => inputRef.current?.click()}
        >
          {reading ? "Reading file…" : "Choose a file"}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[expects]}
          // sr-only, not display:none — a hidden input drops out of the
          // accessibility tree entirely.
          className="sr-only"
          aria-label={`Choose ${WORD[expects]}`}
          disabled={disabled}
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            if (chosen) void accept(chosen);
          }}
        />
      </div>

      {error ? (
        <p role="alert" aria-live="assertive" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
