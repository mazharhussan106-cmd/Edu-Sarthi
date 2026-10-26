// Owns reading a stored file back as bytes on the server, for the AI features:
// a recording for the AI draft, a PDF or photo for the AI card maker. It handles
// the three places a file can live: a path in /public (the seeded demo), the
// dev-only folder on disk, and the private Supabase bucket.
//
// It deliberately does NOT check who may read the file. The route has already
// matched it to the signed-in person; this only fetches what it is told to.
// Browsers play and show files through signed URLs (lib/storage.ts) and never
// use this.

import { readFile } from "fs/promises";
import path from "path";

import { AiError } from "@/lib/aiTranscribe";
import { LOCAL_STORAGE, localPath, resolveMediaUrl } from "@/lib/storage";

export type MediaBytes = { data: ArrayBuffer; contentType: string; filename: string };

const AUDIO_TYPES: Record<string, string> = {
  webm: "audio/webm",
  mp4: "audio/mp4",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  mpeg: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

const FETCH_TIMEOUT_MS = 20_000;
const PUBLIC_DIR = path.join(process.cwd(), "public");

function describe(key: string) {
  const last = key.split("/").pop() || "";
  const ext = last.includes(".") ? (last.split(".").pop()?.toLowerCase() ?? "") : "";
  // The stored file name is whatever the student's device called it, and can
  // hold their name. The transcription service only needs the extension to
  // recognise the format, so that is all it is given.
  const known = ext in AUDIO_TYPES ? ext : "webm";
  return { filename: `audio.${known}`, contentType: AUDIO_TYPES[known] };
}

function toBuffer(b: Buffer): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

/// The bytes behind a storage key, or null when the file is gone or unreadable.
/// Throws what `tooLarge` returns when it is bigger than maxBytes, so a huge
/// file is refused before it is held in memory.
export async function readObjectBytes(key: string, maxBytes: number, tooLarge: () => Error): Promise<ArrayBuffer | null> {
  if (!key) return null;
  try {
    if (key.startsWith("/") || LOCAL_STORAGE) {
      // Both are resolved against a fixed folder and refused if they would
      // leave it; a key is stored data, but a path is never trusted.
      const full = key.startsWith("/") ? path.resolve(PUBLIC_DIR, "." + key) : localPath(key);
      if (!full || (key.startsWith("/") && !full.startsWith(PUBLIC_DIR + path.sep))) return null;
      const buf = await readFile(full);
      if (buf.byteLength > maxBytes) throw tooLarge();
      return toBuffer(buf);
    }

    const url = await resolveMediaUrl(key);
    if (!url) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > maxBytes) throw tooLarge();
    const data = await res.arrayBuffer();
    if (data.byteLength > maxBytes) throw tooLarge();
    return data;
  } catch (err) {
    if (err instanceof AiError) throw err;
    return null;
  }
}

/// A recording, with the generic file name the transcription service is given.
export async function readMediaBytes(key: string, maxBytes: number): Promise<MediaBytes | null> {
  const data = await readObjectBytes(
    key,
    maxBytes,
    () => new AiError("This recording is over 25 MB, which is too large for the AI draft. Write this audit by hand."),
  );
  return data ? { ...describe(key), data } : null;
}
