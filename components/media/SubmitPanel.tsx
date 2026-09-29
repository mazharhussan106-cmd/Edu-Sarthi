// Owns the whole submit flow for one exercise: choose how to provide the media,
// upload it straight to storage, then create the Submission row.
//
// The upload lives here rather than in the Recorder or the Uploader because
// both feed it. Those two produce a File; this is the only thing that talks to
// the network.
//
// The PUT goes through XMLHttpRequest, not fetch: fetch reports no upload
// progress, and on patchy mobile data a two-minute video with no progress bar
// looks exactly like a frozen app.
//
// It deliberately uploads direct to storage rather than through a route
// handler. Vercel caps a function's request body at 4.5 MB — a two-minute
// video posted through an API route fails outright.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MediaKind } from "@prisma/client";

import { Button } from "@/components/ui/Button";
import { Recorder } from "@/components/media/Recorder";
import { Uploader } from "@/components/media/Uploader";
import { formatBytes } from "@/lib/media";

type Source = "record" | "upload";

/// Resolves true on a 2xx, false on any failure. Never rejects, so the caller
/// has one path for "did not finish" whatever the cause.
function putWithProgress(
  url: string,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.ontimeout = () => resolve(false);
    xhr.send(file);
  });
}

async function parseJson(res: Response) {
  // text() then JSON.parse, never a bare res.json(). A serverless timeout
  // returns an HTML error page, and res.json() on that throws "Unexpected end
  // of JSON input", which tells the student nothing.
  const raw = await res.text();
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function SubmitPanel({
  exerciseId,
  expects,
  maxSeconds,
  maxBytes,
  retryOfId,
  wordId,
  submitLabel = "Send to a teacher",
}: {
  exerciseId: string;
  expects: MediaKind;
  maxSeconds: number | null;
  maxBytes: number;
  /// Set on the send-back screen: the new recording replaces this attempt.
  retryOfId?: string;
  /// Set when recording from a flashcard: the word the recording is about.
  wordId?: string;
  submitLabel?: string;
}) {
  const router = useRouter();

  // Images cannot be recorded, so there is nothing to choose between.
  const [source, setSource] = useState<Source>(
    expects === "IMAGE" ? "upload" : "record",
  );
  const [recordingBlocked, setRecordingBlocked] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "uploading" | "saving">("idle");
  const [progress, setProgress] = useState(0);

  function handleUnavailable(reason: string) {
    // Falls all the way over to the uploader rather than showing a dead Record
    // button. The reason stays on screen so the student knows why the tab
    // changed under them.
    setRecordingBlocked(reason);
    setSource("upload");
  }

  async function submit() {
    if (!file) return;
    setError(null);
    setStage("uploading");
    setProgress(0);

    try {
      const urlRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          exerciseId,
        }),
      });

      const urlData = await parseJson(urlRes);
      if (!urlRes.ok || !urlData?.url) {
        setError((urlData?.error as string) ?? "Could not start the upload. Try again.");
        setStage("idle");
        return;
      }

      // Straight to Supabase. Nothing about this request touches our server,
      // so file size is bounded by the bucket, not by a function limit.
      const put = await putWithProgress(urlData.url as string, file, setProgress);

      if (!put) {
        setError(
          "The upload did not finish. Check your connection and try again — your recording is still here.",
        );
        setStage("idle");
        return;
      }

      setStage("saving");

      const saveRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          key: urlData.key,
          contentType: file.type,
          durationSec,
          ...(retryOfId ? { retryOfId } : {}),
          ...(wordId ? { wordId } : {}),
        }),
      });

      const saveData = await parseJson(saveRes);
      if (!saveRes.ok) {
        setError((saveData?.error as string) ?? "Could not save your submission. Try again.");
        setStage("idle");
        return;
      }

      // To My Audits, where the new attempt now shows as waiting — the answer
      // to the question every student has right after pressing Send.
      router.push("/feedback?sent=1");
      router.refresh();
    } catch {
      setError("Could not reach the server. Your recording is still here — try again.");
      setStage("idle");
    }
  }

  const busy = stage !== "idle";

  return (
    <div>
      {expects !== "IMAGE" ? (
        <div className="flex gap-2">
          <Button
            variant={source === "record" ? "primary" : "outline"}
            size="sm"
            disabled={busy || recordingBlocked !== null}
            onClick={() => setSource("record")}
          >
            Record now
          </Button>
          <Button
            variant={source === "upload" ? "primary" : "outline"}
            size="sm"
            disabled={busy}
            onClick={() => setSource("upload")}
          >
            Upload a file
          </Button>
        </div>
      ) : null}

      {recordingBlocked ? (
        <p aria-live="polite" className="mt-3 text-xs text-ink-muted">
          {recordingBlocked}
        </p>
      ) : null}

      <div className="mt-4">
        {source === "record" && expects !== "IMAGE" ? (
          <Recorder
            kind={expects === "VIDEO" ? "VIDEO" : "AUDIO"}
            maxSeconds={maxSeconds}
            disabled={busy}
            onSelect={(f, d) => {
              setFile(f);
              setDurationSec(d);
            }}
            onUnavailable={handleUnavailable}
          />
        ) : (
          <Uploader
            expects={expects}
            maxBytes={maxBytes}
            disabled={busy}
            onSelect={(f, d) => {
              setFile(f);
              setDurationSec(d);
            }}
          />
        )}
      </div>

      {stage !== "idle" ? (
        <div className="mt-4" aria-live="polite">
          <div className="flex justify-between text-xs text-ink-muted">
            <span>{stage === "uploading" ? "Uploading…" : "Saving…"}</span>
            <span className="font-mono">{Math.round(progress * 100)}%</span>
          </div>
          <div
            className="mt-1 h-2 overflow-hidden rounded-full bg-paper-dim"
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className="h-full rounded-full bg-success transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          {stage === "uploading" ? (
            <p className="mt-1 text-xs text-mist">
              Keep this screen open. On mobile data a longer clip can take a
              minute.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" aria-live="assertive" className="mt-3 text-xs text-error">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={() => void submit()} disabled={!file || busy}>
          {stage === "uploading"
            ? "Uploading…"
            : stage === "saving"
              ? "Saving…"
              : submitLabel}
        </Button>

        {file ? (
          <p className="text-xs text-ink-muted">
            {formatBytes(file.size)}
            {durationSec !== null ? ` · ${durationSec}s` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
