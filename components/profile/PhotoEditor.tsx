// Owns the photo part of the Edit profile sheet: the current photo (or
// initials), Change photo and Remove photo, and the crop step in between.
//
// The crop happens here, in the browser: move by dragging or with the arrow
// keys, zoom with the slider, then the square is drawn again at 512 × 512 and
// only that new file is uploaded. Drawing it again drops the camera's hidden
// data (GPS, phone model) and keeps the upload small on mobile data. The dim
// area around the circle is painted with the theme's own paper colour.
//
// It deliberately does NOT save the name or number; the sheet's form does.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";
import { AVATAR_PX, PICK_TYPES, avatarFileSchema, pickProblem } from "@/lib/avatarFile";

const STAGE = 280;
const MAX_ZOOM = 3;

type Pos = { x: number; y: number };

function sizeAt(img: HTMLImageElement, zoom: number) {
  const base = Math.max(STAGE / img.naturalWidth, STAGE / img.naturalHeight);
  return { w: img.naturalWidth * base * zoom, h: img.naturalHeight * base * zoom };
}

// The picture must always cover the square, so its edges never come inside it.
function clamp(p: Pos, w: number, h: number): Pos {
  return { x: Math.min(0, Math.max(STAGE - w, p.x)), y: Math.min(0, Math.max(STAGE - h, p.y)) };
}

const toBlob = (c: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>((res) => c.toBlob(res, type, q));

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
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ px: number; py: number; from: Pos } | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !img) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = STAGE * dpr;
    c.height = STAGE * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { w, h } = sizeAt(img, zoom);
    ctx.clearRect(0, 0, STAGE, STAGE);
    ctx.drawImage(img, pos.x, pos.y, w, h);
    const css = getComputedStyle(c);
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = css.getPropertyValue("--color-paper").trim() || "gray";
    ctx.beginPath();
    ctx.rect(0, 0, STAGE, STAGE);
    ctx.arc(STAGE / 2, STAGE / 2, STAGE / 2 - 2, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();
    ctx.strokeStyle = css.getPropertyValue("--color-accent").trim() || "gray";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(STAGE / 2, STAGE / 2, STAGE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [img, zoom, pos]);

  function stop() {
    if (img) URL.revokeObjectURL(img.src);
    setImg(null);
    onCropping(false);
  }

  function pick(file: File) {
    setError(null);
    const problem = pickProblem(file);
    if (problem) return setError(problem);
    const im = new Image();
    im.onload = () => {
      const { w, h } = sizeAt(im, 1);
      setZoom(1);
      setPos({ x: (STAGE - w) / 2, y: (STAGE - h) / 2 });
      setImg(im);
      onCropping(true);
    };
    im.onerror = () => setError("That photo could not be opened. Choose a JPG, PNG or WebP photo.");
    im.src = URL.createObjectURL(file);
  }

  function changeZoom(z: number) {
    if (!img) return;
    // Zoom around the middle of the circle, not the corner.
    const before = sizeAt(img, zoom);
    const after = sizeAt(img, z);
    const fx = (STAGE / 2 - pos.x) / before.w;
    const fy = (STAGE / 2 - pos.y) / before.h;
    setZoom(z);
    setPos(clamp({ x: STAGE / 2 - fx * after.w, y: STAGE / 2 - fy * after.h }, after.w, after.h));
  }

  function nudge(dx: number, dy: number) {
    if (!img) return;
    const { w, h } = sizeAt(img, zoom);
    setPos((p) => clamp({ x: p.x + dx, y: p.y + dy }, w, h));
  }

  async function use() {
    if (!img) return;
    setBusy(true);
    setError(null);
    const out = document.createElement("canvas");
    out.width = AVATAR_PX;
    out.height = AVATAR_PX;
    const ctx = out.getContext("2d");
    const k = AVATAR_PX / STAGE;
    const { w, h } = sizeAt(img, zoom);
    ctx?.drawImage(img, pos.x * k, pos.y * k, w * k, h * k);
    // Some browsers cannot write WebP and hand back a PNG; JPEG then.
    let blob = await toBlob(out, "image/webp", 0.85);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(out, "image/jpeg", 0.88);
    const check = avatarFileSchema.safeParse({ contentType: blob?.type, sizeBytes: blob?.size ?? 0 });
    if (!blob || !check.success) {
      setBusy(false);
      return setError(check.success ? "That photo could not be made smaller. Choose a different one." : (check.error.issues[0]?.message ?? "Choose the photo again."));
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
  }

  if (img) {
    return (
      <div className="flex flex-col items-center gap-3">
        <canvas
          ref={canvas}
          tabIndex={0}
          role="img"
          aria-label="Your photo inside the circle. Drag it, or use the arrow keys, to move it."
          style={{ width: STAGE, height: STAGE }}
          className="cursor-grab touch-none rounded-xl bg-paper-dim active:cursor-grabbing"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { px: e.clientX, py: e.clientY, from: pos };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || !img) return;
            const { w, h } = sizeAt(img, zoom);
            setPos(clamp({ x: d.from.x + e.clientX - d.px, y: d.from.y + e.clientY - d.py }, w, h));
          }}
          onPointerUp={() => (drag.current = null)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 40 : 10;
            const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            const m = moves[e.key];
            if (m) {
              e.preventDefault();
              nudge(m[0], m[1]);
            }
          }}
        />
        <label className="flex w-full max-w-[280px] items-center gap-3 text-xs text-ink-muted">
          Zoom
          <input type="range" min={1} max={MAX_ZOOM} step={0.05} value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} className="flex-1 accent-accent" />
        </label>
        <p className="text-center text-xs text-ink-muted">Saved as a small 512 × 512 picture without the camera&apos;s location data.</p>
        {error ? (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        ) : null}
        <div className="flex w-full gap-2 [&>*]:flex-1">
          <Button variant="outline" onClick={stop} disabled={busy}>
            Back
          </Button>
          <Button onClick={() => void use()} disabled={busy}>
            {busy ? "Saving…" : "Use photo"}
          </Button>
        </div>
      </div>
    );
  }

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
