// Owns the whole submit flow for one exercise: choose how to provide the media,
// upload it straight to storage, then create the Submission row.
//
// The upload lives here rather than in the Recorder or the Uploader because
// both feed it. Those two produce a File; this is the only thing that talks to
// the network.
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
}: {
  exerciseId: string;
  expects: MediaKind;
  maxSeconds: number | null;
  maxBytes: number;
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
      const put = await fetch(urlData.url as string, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!put.ok) {
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
        }),
      });

      const saveData = await parseJson(saveRes);
      if (!saveRes.ok) {
        setError((saveData?.error as string) ?? "Could not save your submission. Try again.");
        setStage("idle");
        return;
      }

      router.push("/modules");
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
              : "Send to a teacher"}
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
