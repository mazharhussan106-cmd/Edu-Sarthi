// Owns the photo part of the Edit profile sheet: the current photo (or
// initials), Change photo and Remove photo, opening the crop step
// (components/profile/PhotoCropper) and uploading what it returns.
//
// Upload is three steps, like institute logos: ask for a signed URL, send the
// file, hand the key back (app/api/profile/avatar). Focus goes back to the
// photo button when the crop step closes, so a keyboard user never lands on
// nothing. The picked picture is released from memory when the step closes,
// however it closes.
//
// It deliberately does NOT save the name or number; the sheet's form does.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { callApi } from "@/components/decks/deckClient";
import { PhotoCropper } from "@/components/profile/PhotoCropper";
import { PICK_TYPES, avatarFileSchema, pickProblem } from "@/lib/avatarFile";

export function PhotoEditor({
  photoUrl,
  initials,
  note,
  onCropping,
}: {
  photoUrl: string | null;
  initials: string;
  /** Who sees the photo, in words for this role. */
  note: string;
  onCropping: (on: boolean) => void;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const returnFocus = useRef(false);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Release the picked picture when the crop step ends or the sheet closes.
  useEffect(() => {
    if (!img) return;
    return () => URL.revokeObjectURL(img.src);
  }, [img]);

  useEffect(() => {
    if (img || !returnFocus.current) return;
    returnFocus.current = false;
    fileInput.current?.focus();
  }, [img]);

  function stop() {
    returnFocus.current = true;
    setImg(null);
    setError(null);
    onCropping(false);
  }

  function pick(file: File) {
    setError(null);
    const problem = pickProblem(file);
    if (problem) return setError(problem);
    const im = new Image();
    im.onload = () => {
      setImg(im);
      onCropping(true);
    };
    im.onerror = () => {
      URL.revokeObjectURL(im.src);
      setError("That photo could not be opened. Choose a JPG, PNG or WebP photo.");
    };
    im.src = URL.createObjectURL(file);
  }

  async function upload(blob: Blob) {
    setBusy(true);
    setError(null);
    const check = avatarFileSchema.safeParse({ contentType: blob.type, sizeBytes: blob.size });
    if (!check.success) {
      setBusy(false);
      return setError(check.error.issues[0]?.message ?? "Choose the photo again.");
    }
    const target = await callApi<{ key: string; url: string }>("/api/profile/avatar", { action: "upload", ...check.data });
    let sent = false;
    if (target.ok) {
      try {
        sent = (await fetch(target.data.url, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob })).ok;
      } catch {
        sent = false;
      }
    }
    const saved = sent && target.ok ? await callApi("/api/profile/avatar", { action: "save", key: target.data.key }) : null;
    setBusy(false);
    if (!target.ok) return setError(target.error);
    if (!saved) return setError("The photo did not upload. Check your connection and try again.");
    if (!saved.ok) return setError(saved.error);
    stop();
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("The photo was not removed. Check your connection and try again.");
    }
    setBusy(false);
    fileInput.current?.focus();
  }

  if (img) return <PhotoCropper img={img} busy={busy} error={error} onUse={(b) => void upload(b)} onBack={stop} />;

  return (
    <div>
      <div className="flex items-center gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Your profile photo" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent/12 font-display text-xl font-bold text-accent-dark">
            {initials}
          </span>
        )}
        <div className="flex flex-col items-start gap-1.5">
          <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
            {photoUrl ? "Change photo" : "Add a photo"}
            <input
              ref={fileInput}
              type="file"
              accept={PICK_TYPES.join(",")}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) pick(f);
              }}
            />
          </label>
          {photoUrl ? (
            <button type="button" onClick={() => void remove()} disabled={busy} className="rounded text-xs font-medium text-error hover:underline">
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-muted">JPG, PNG or WebP. {note}</p>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
