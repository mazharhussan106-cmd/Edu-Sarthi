// Owns "Profile photo" in Settings: choose a picture, shrink it here in the
// browser to a 256×256 square (a phone photo of several MB becomes a few tens
// of KB before it touches mobile data), upload it, and remove it.
//
// It says plainly who will see the photo: a student's is seen only by them; a
// teacher's is shown to students after an admin checks it (owner's decision
// N9). It deliberately approves nothing and checks nothing the server must:
// lib/avatar re-checks the file's own bytes.

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";
import { avatarActionSchema } from "@/lib/accountSchemas";

const SIDE = 256;
/// Decoding is the slow part on an old phone; past this, ask for a smaller file.
const MAX_INPUT_BYTES = 20 * 1024 * 1024;

type Props = { url: string | null; name: string | null; shownToStudents: "yes" | "waiting" | "no" | null; note: string | null };

/// A centred square, shrunk. WebP where the browser can write it, else JPEG
/// (older Safari hands back a large PNG when asked for WebP).
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIDE;
  canvas.height = SIDE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  // Pixels of the photo, not page styling: a see-through PNG would otherwise
  // turn black once saved as a JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIDE, SIDE);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIDE, SIDE);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((done) => canvas.toBlob(done, type, 0.85));
  const webp = await encode("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg");
  if (!jpeg) throw new Error("no encoder");
  return jpeg;
}

export function AvatarForm({ url, name, shownToStudents, note }: Props) {
  const uid = useId();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Choose a photo (JPG, PNG or WebP).");
    if (file.size > MAX_INPUT_BYTES) return setError("That photo is very large. Choose one under 20 MB.");
    setBusy(true);
    let blob: Blob;
    try {
      blob = await shrink(file);
    } catch {
      setBusy(false);
      return setError("This phone could not open that picture. Choose a JPG or PNG photo.");
    }
    const ask = avatarActionSchema.safeParse({ action: "upload", contentType: blob.type, sizeBytes: blob.size });
    if (!ask.success) {
      setBusy(false);
      return setError(ask.error.issues[0]?.message ?? "Choose a different photo.");
    }
    const target = await callApi<{ key: string; url: string }>("/api/profile/avatar", ask.data);
    if (!target.ok) {
      setBusy(false);
      return setError(target.error);
    }
    const sent = await fetch(target.data.url, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob }).then((r) => r.ok, () => false);
    if (!sent) {
      setBusy(false);
      return setError("The photo did not upload. Check your connection and choose it again.");
    }
    const saved = await callApi("/api/profile/avatar", { action: "save", key: target.data.key });
    setBusy(false);
    if (!saved.ok) return setError(saved.error);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await callApi("/api/profile/avatar", { action: "remove" });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Avatar src={url} name={name} alt={url ? "Your profile photo" : ""} size="lg" />
        <div className="min-w-0 text-xs text-ink-muted">
          {shownToStudents === null ? (
            <p>Only you can see your photo. Teachers see you by your student ID, never by face or name.</p>
          ) : (
            <>
              <p>Students see your photo on the audits you write, once an admin has checked it.</p>
              {shownToStudents === "yes" ? <Badge variant="success" className="mt-1.5">Students can see it</Badge> : null}
              {shownToStudents === "waiting" ? <Badge variant="accent" className="mt-1.5">Waiting for an admin to check</Badge> : null}
            </>
          )}
        </div>
      </div>
      {note ? (
        <p className="rounded-lg bg-error/12 p-2 text-sm text-ink">
          <b>Photo not approved:</b> {note} Upload a different one.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${uid}-file`} className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
          {busy ? "Uploading…" : url ? "Change photo" : "Add a photo"}
          <input
            id={`${uid}-file`}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }}
          />
        </label>
        {url ? (
          <Button variant="ghost" size="sm" disabled={busy} className="text-error" onClick={() => void remove()}>
            Remove photo
          </Button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
