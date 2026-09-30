// Owns every interaction with Supabase Storage: minting upload URLs and
// resolving a stored key into a readable URL.
//
// The bucket is PRIVATE. Nothing in this app hands out a permanent link to a
// student's recording — reads go through a short-lived signed URL generated
// per page view.
//
// Without Supabase configured, and only outside production, it falls back to
// a folder on disk (.dev-uploads/) served by /api/dev-storage. That lets the
// whole record → upload → audit loop run on a laptop with no cloud account.
// Production with the keys missing still throws, exactly as before.
//
// It deliberately does NOT run in the browser. It uses the service-role key,
// which bypasses row-level security entirely; importing this file into a
// client component would ship that key to every visitor.

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { rm, stat } from "fs/promises";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const BUCKET = "submissions";

/// True only in development with no Supabase keys. Never true in production:
/// a missing key there must fail loudly, not quietly write to a disk that a
/// serverless function loses on the next cold start.
export const LOCAL_STORAGE =
  process.env.NODE_ENV !== "production" && (!SUPABASE_URL || !SERVICE_ROLE_KEY);

export const LOCAL_DIR = path.join(process.cwd(), ".dev-uploads");

/// Resolves a key to a file inside LOCAL_DIR, or null if the key would escape
/// it. Keys come from buildKey(), but the dev route takes them from a URL.
export function localPath(key: string): string | null {
  const full = path.resolve(LOCAL_DIR, key);
  return full.startsWith(LOCAL_DIR + path.sep) ? full : null;
}

/// Seconds a read URL stays valid. Long enough to play a 5-minute recording
/// and scrub back through it, short enough that a copied URL is useless by
/// the time it is shared.
const READ_URL_TTL_SEC = 60 * 30;

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

/// Checked before a URL is issued. Once signed, the client can send whatever
/// it likes, so this is the only place the type is our decision.
export const ALLOWED_TYPES: Record<string, "AUDIO" | "VIDEO" | "IMAGE"> = {
  "audio/webm": "AUDIO",
  "audio/mp4": "AUDIO",
  "audio/mpeg": "AUDIO",
  "audio/ogg": "AUDIO",
  "audio/wav": "AUDIO",
  "video/webm": "VIDEO",
  "video/mp4": "VIDEO",
  "video/quicktime": "VIDEO",
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
};

// Thrown rather than returning a broken client. A missing key that only
// surfaces when a student presses Submit is a bug reported as "upload is
// broken" days later.
function client() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for uploads",
    );
  }

  // No session persistence: this runs per-request on the server and has no
  // user to keep signed in.
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/// Strips anything that could change the meaning of the path. A filename is
/// user input, and "../../other-student/recording.mp3" is a filename.
function sanitise(filename: string): string {
  return (
    filename
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(-60) || "file"
  );
}

/// Namespaced by user id, so one student's key can never be guessed from
/// another's, and a stray listing is scoped to one person.
export function buildKey(userId: string, filename: string): string {
  return `${userId}/${randomUUID()}-${sanitise(filename)}`;
}

export type UploadTarget = { key: string; url: string; token: string };

export async function createUploadTarget(
  userId: string,
  filename: string,
): Promise<UploadTarget> {
  const key = buildKey(userId, filename);

  if (LOCAL_STORAGE) {
    return { key, url: `/api/dev-storage/${key}`, token: "local" };
  }

  const { data, error } = await client()
    .storage.from(BUCKET)
    .createSignedUploadUrl(key);

  if (error || !data) {
    throw new Error(`Could not create an upload URL: ${error?.message}`);
  }

  return { key, url: data.signedUrl, token: data.token };
}

/// Resolves a stored value into something an <audio> or <img> can use.
///
/// Returns null rather than throwing: a broken link on one submission should
/// not take down a page listing twenty of them.
export async function resolveMediaUrl(key: string): Promise<string | null> {
  // Empty once the retention policy has deleted the file (mediaPurgedAt).
  if (!key) return null;
  // The seeded demo submission stores "/sample.mp3", a file in /public. Left
  // as-is so the review flow can be tested before anything is uploaded.
  if (key.startsWith("/") || key.startsWith("http")) return key;

  if (LOCAL_STORAGE) return `/api/dev-storage/${key}`;

  try {
    const { data, error } = await client()
      .storage.from(BUCKET)
      .createSignedUrl(key, READ_URL_TTL_SEC);

    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/// The HEAD check: does the file behind this key actually exist? Run before a
/// Submission row is created, so a client that skips or abandons the upload
/// cannot put a row in the teacher queue that will never play.
///
/// Returns false on any error. Refusing a real upload costs the student one
/// retry; accepting a missing one costs a teacher a dead claim.
export async function objectExists(key: string): Promise<boolean> {
  if (LOCAL_STORAGE) {
    const full = localPath(key);
    if (!full) return false;
    try {
      return (await stat(full)).size > 0;
    } catch {
      return false;
    }
  }

  try {
    const { data, error } = await client().storage.from(BUCKET).exists(key);
    return !error && data === true;
  } catch {
    return false;
  }
}

/// Deletes stored files, for account deletion. Best effort: a file that is
/// already gone is not an error, and one failed delete must not stop the
/// account itself from being erased.
export async function removeObjects(keys: readonly string[]): Promise<void> {
  const real = keys.filter((k) => !k.startsWith("/") && !k.startsWith("http"));
  if (real.length === 0) return;

  if (LOCAL_STORAGE) {
    await Promise.all(
      real.map(async (k) => {
        const full = localPath(k);
        if (full) await rm(full, { force: true });
      }),
    );
    return;
  }

  try {
    await client().storage.from(BUCKET).remove(real);
  } catch {
    console.error("Could not delete some stored files during account deletion");
  }
}
