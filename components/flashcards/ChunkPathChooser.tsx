// Owns the one-time choice on the Chunk tab: Path A (level by level) or
// Path B (stage by stage). Both paths cover the same Core 220 first, in a
// different order, then the rest of the library by level.
//
// Saved as a preference, so it follows the student to other devices; it can
// be changed later in Settings. Saves, then reloads the page on the server.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CHUNK_PATHS, type ChunkPath } from "@/lib/chunkCard";

export async function saveChunkPath(path: ChunkPath): Promise<string | null> {
  try {
    const res = await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chunkPath: path }),
    });
    return res.ok ? null : "That did not save. Try again in a moment.";
  } catch {
    return "No connection. Try again when you are back online.";
  }
}

export function ChunkPathChooser() {
  const router = useRouter();
  const [busy, setBusy] = useState<ChunkPath | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(p: ChunkPath) {
    setBusy(p);
    setError(null);
    const e = await saveChunkPath(p);
    if (e) {
      setError(e);
      setBusy(null);
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="path-title" className="mt-4 rounded-2xl border border-border bg-surface p-4">
      <h2 id="path-title" className="font-display text-lg font-bold text-ink">Choose your chunk path</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Both paths start with the Core 220 chunks, in a different order, then move through the rest of the library by level.
        You can change this later in Settings.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CHUNK_PATHS.map((p) => (
          <button
            key={p.value}
            type="button"
            disabled={busy !== null}
            onClick={() => void choose(p.value)}
            className="rounded-xl border-2 border-border-strong p-4 text-left hover:border-accent hover:bg-hover disabled:opacity-60"
          >
            <span className="block font-display font-bold text-ink">{p.title}</span>
            <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm text-ink-muted">
              {p.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <span className="mt-3 inline-block text-sm font-medium text-accent">{busy === p.value ? "Saving…" : "Start this path →"}</span>
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
