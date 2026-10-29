// Owns the crop step of a profile photo: the picture in a square with a circle
// over it, moved by dragging or the arrow keys and zoomed with the slider,
// then drawn again at 512 × 512 and handed back as a small file.
//
// Drawing it again is what drops the camera's hidden data (GPS, phone model)
// and keeps the upload small on mobile data. The dim area around the circle
// is painted with the theme's own paper colour. Focus moves to the picture
// when the step opens, so a keyboard user lands where the arrow keys work.
//
// It deliberately does NOT upload anything; components/profile/PhotoEditor
// does, with the file this returns.

"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { AVATAR_PX } from "@/lib/avatarFile";

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

const MOVES: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export function PhotoCropper({
  img,
  busy,
  error,
  onUse,
  onBack,
}: {
  img: HTMLImageElement;
  busy: boolean;
  error: string | null;
  onUse: (file: Blob) => void;
  onBack: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ px: number; py: number; from: Pos } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<Pos>(() => {
    const { w, h } = sizeAt(img, 1);
    return { x: (STAGE - w) / 2, y: (STAGE - h) / 2 };
  });
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    canvas.current?.focus();
  }, []);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = STAGE * dpr;
    c.height = STAGE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { w, h } = sizeAt(img, zoom);
    ctx.clearRect(0, 0, STAGE, STAGE);
    ctx.drawImage(img, pos.x, pos.y, w, h);
    const css = getComputedStyle(c);
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = css.getPropertyValue("--color-paper").trim();
    ctx.beginPath();
    ctx.rect(0, 0, STAGE, STAGE);
    ctx.arc(STAGE / 2, STAGE / 2, STAGE / 2 - 2, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();
    ctx.strokeStyle = css.getPropertyValue("--color-accent").trim();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(STAGE / 2, STAGE / 2, STAGE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [img, zoom, pos]);

  function changeZoom(z: number) {
    // Zoom around the middle of the circle, not the corner.
    const before = sizeAt(img, zoom);
    const after = sizeAt(img, z);
    const fx = (STAGE / 2 - pos.x) / before.w;
    const fy = (STAGE / 2 - pos.y) / before.h;
    setZoom(z);
    setPos(clamp({ x: STAGE / 2 - fx * after.w, y: STAGE / 2 - fy * after.h }, after.w, after.h));
  }

  function moveBy(dx: number, dy: number, from = pos) {
    const { w, h } = sizeAt(img, zoom);
    setPos(clamp({ x: from.x + dx, y: from.y + dy }, w, h));
  }

  async function use() {
    setProblem(null);
    const out = document.createElement("canvas");
    out.width = AVATAR_PX;
    out.height = AVATAR_PX;
    const k = AVATAR_PX / STAGE;
    const { w, h } = sizeAt(img, zoom);
    out.getContext("2d")?.drawImage(img, pos.x * k, pos.y * k, w * k, h * k);
    // Some browsers cannot write WebP and hand back a PNG; JPEG then.
    let blob = await toBlob(out, "image/webp", 0.85);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(out, "image/jpeg", 0.88);
    if (!blob) return setProblem("That photo could not be made smaller. Choose a different one.");
    onUse(blob);
  }

  const shown = problem ?? error;
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
          if (d) moveBy(e.clientX - d.px, e.clientY - d.py, d.from);
        }}
        onPointerUp={() => (drag.current = null)}
        // A touch the browser takes over (a scroll, a call) ends the drag too.
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(e) => {
          const m = MOVES[e.key];
          if (!m) return;
          e.preventDefault();
          const step = e.shiftKey ? 40 : 10;
          moveBy(m[0] * step, m[1] * step);
        }}
      />
      <label className="flex w-full max-w-[280px] items-center gap-3 text-xs text-ink-muted">
        Zoom
        <input type="range" min={1} max={MAX_ZOOM} step={0.05} value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} className="flex-1 accent-accent" />
      </label>
      <p className="text-center text-xs text-ink-muted">Saved as a small 512 × 512 picture without the camera&apos;s location data.</p>
      {shown ? (
        <p role="alert" className="text-xs text-error">
          {shown}
        </p>
      ) : null}
      <div className="flex w-full gap-2 [&>*]:flex-1">
        <Button variant="outline" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button onClick={() => void use()} disabled={busy}>
          {busy ? "Saving…" : "Use photo"}
        </Button>
      </div>
    </div>
  );
}
