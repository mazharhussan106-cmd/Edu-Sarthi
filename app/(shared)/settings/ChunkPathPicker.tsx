// Owns changing the chunk learning path in Settings (the Chunk tab asks once;
// this is where a student changes their mind). Saves on tap, like every other
// setting on this page. Progress is kept: cards already started stay on their
// own review dates; only the order of new chunks changes.

"use client";

import { useState } from "react";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { saveChunkPath } from "@/components/flashcards/ChunkPathChooser";
import { CHUNK_PATHS, type ChunkPath } from "@/lib/chunkCard";

export function ChunkPathPicker({ initial }: { initial: ChunkPath | null }) {
  const [path, setPath] = useState<ChunkPath | null>(initial);
  const [notice, setNotice] = useState<string | null>(null);

  async function choose(p: ChunkPath) {
    setPath(p);
    setNotice(await saveChunkPath(p));
  }

  return (
    <div>
      <SegmentedControl
        label="Chunk path"
        description="The order new chunks come in. Chunks you have already started keep their review dates."
        options={CHUNK_PATHS.map((p) => ({ value: p.value, label: p.title }))}
        value={path ?? ""}
        onValueChange={(v) => void choose(v as ChunkPath)}
      />
      {notice ? (
        <p aria-live="polite" className="mt-2 text-xs text-ink-muted">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
