// Owns the physical card: its frame and header band, turning over between
// the three sides, and every gesture on it —
//   tap            → turn to the next side (3 goes back to 1)
//   swipe ← / →    → next / previous card
//   pinch, drag    → zoom and move inside the card (sides 1 and 2)
//   keyboard       → Enter/Space turn, ←/→ cards, + / − / 0 zoom
//
// Sides 1 and 2 always fit the box (useFitFont) and zoom in place; side 3 is
// longer and scrolls up and down instead, because it holds inputs and a
// zoomed text box is awkward to type in.
//
// It deliberately does NOT know what is on a side or what "next card" means;
// the deck passes both in. Plain pointer events, no gesture library: the
// maths is twenty lines and a dependency would be the heaviest thing here.

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cardFrameStyle, cardSheetStyle, type CardColor } from "@/lib/cardColors";
import { cn } from "@/lib/utils";
import { useFitFont } from "@/components/flashcards/useFitFont";

const MAX_ZOOM = 3;
const SWIPE_PX = 60;
const TAP_SLOP_PX = 10;
// Taps on these must do their own job, not turn the card.
const INTERACTIVE = "a,button,input,textarea,select,label,summary,[data-no-turn]";

type View = { s: number; x: number; y: number };
const RESET: View = { s: 1, x: 0, y: 0 };

export function CardSurface({
  side,
  titles,
  word,
  color,
  onTurn,
  onSwipe,
  children,
}: {
  side: 0 | 1 | 2;
  titles: readonly [string, string, string];
  word: string;
  color: CardColor;
  onTurn: () => void;
  onSwipe: (dir: "next" | "prev") => void;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const face = useRef<HTMLDivElement>(null);
  const zoomable = side !== 2;
  const { overflow } = useFitFont(box, content, zoomable, `${word}-${side}`, side === 1 ? 11 : undefined);
  const [view, setView] = useState<View>(RESET);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const g = useRef({ x0: 0, y0: 0, t0: 0, moved: false, pinched: false, d0: 0, v0: RESET, mid: { x: 0, y: 0 } });

  // A new side or a new card starts unzoomed, with a short turn animation.
  useEffect(() => {
    setView(RESET);
    box.current?.scrollTo({ top: 0 });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    face.current?.animate(
      [{ transform: "perspective(1200px) rotateY(-70deg)", opacity: 0.3 }, { transform: "none", opacity: 1 }],
      { duration: 220, easing: "ease-out" },
    );
  }, [side, word]);

  // Keeps the zoomed content covering the box, so a drag cannot lose it.
  function clamp(v: View): View {
    const b = box.current;
    const c = content.current;
    if (!b || !c || v.s <= 1) return RESET;
    const minX = b.clientWidth - c.offsetWidth * v.s;
    const minY = Math.min(0, b.clientHeight - c.offsetHeight * v.s);
    return { s: v.s, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) };
  }

  function zoomAt(s: number, cx: number, cy: number, from: View) {
    const next = Math.min(MAX_ZOOM, Math.max(1, s));
    // The point under the fingers stays under the fingers.
    const k = next / from.s;
    setView(clamp({ s: next, x: cx - (cx - from.x) * k, y: cy - (cy - from.y) * k }));
  }

  function local(e: React.PointerEvent) {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function down(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pts.current.set(e.pointerId, local(e));
    const s = g.current;
    if (pts.current.size === 1) {
      Object.assign(s, { x0: e.clientX, y0: e.clientY, t0: Date.now(), moved: false, pinched: false, v0: view });
    } else if (pts.current.size === 2 && zoomable) {
      const [a, b] = [...pts.current.values()];
      Object.assign(s, { pinched: true, d0: Math.hypot(a.x - b.x, a.y - b.y), v0: view, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } });
    }
  }

  function move(e: React.PointerEvent) {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, local(e));
    const s = g.current;
    const dx = e.clientX - s.x0;
    const dy = e.clientY - s.y0;
    if (Math.hypot(dx, dy) > TAP_SLOP_PX) s.moved = true;
    if (s.pinched && pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      zoomAt((s.v0.s * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, s.d0), s.mid.x, s.mid.y, s.v0);
    } else if (!s.pinched && view.s > 1) {
      setView(clamp({ s: s.v0.s, x: s.v0.x + dx, y: s.v0.y + dy }));
    }
  }

  function up(e: React.PointerEvent) {
    if (!pts.current.delete(e.pointerId)) return;
    const s = g.current;
    if (pts.current.size > 0) return;
    if (s.pinched || view.s > 1) return;
    const dx = e.clientX - s.x0;
    const dy = e.clientY - s.y0;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > 1.5 * Math.abs(dy)) return onSwipe(dx < 0 ? "next" : "prev");
    const onControl = (e.target as HTMLElement).closest(INTERACTIVE);
    if (!s.moved && !onControl && Date.now() - s.t0 < 500) onTurn();
  }

  function key(e: React.KeyboardEvent) {
    if (e.target !== e.currentTarget) return;
    const b = box.current;
    const mid = { x: (b?.clientWidth ?? 0) / 2, y: (b?.clientHeight ?? 0) / 2 };
    const act: Record<string, () => void> = {
      Enter: onTurn,
      " ": onTurn,
      ArrowRight: () => onSwipe("next"),
      ArrowLeft: () => onSwipe("prev"),
      "+": () => zoomable && zoomAt(view.s + 0.25, mid.x, mid.y, view),
      "=": () => zoomable && zoomAt(view.s + 0.25, mid.x, mid.y, view),
      "-": () => zoomAt(view.s - 0.25, mid.x, mid.y, view),
      "0": () => setView(RESET),
    };
    if (act[e.key]) {
      e.preventDefault();
      act[e.key]();
    }
  }

  return (
    <div
      ref={face}
      tabIndex={0}
      role="group"
      aria-roledescription="flashcard"
      aria-label={`${word}. ${titles[side]}, side ${side + 1} of 3. Enter turns the card, arrow keys change card, plus and minus zoom.`}
      onKeyDown={key}
      style={cardFrameStyle(color)}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border-[1.5px] border-border-strong bg-surface shadow-[0_6px_18px_var(--color-shadow)]",
        // A coloured card shows its colour as a frame round the text sheet.
        color !== "plain" && "pb-1.5",
      )}
    >
      <div className="flex shrink-0 items-center justify-between bg-tag-navy px-3 py-1.5 font-display text-[11px] font-bold tracking-wider text-surface">
        <span aria-live="polite">{titles[side]}</span>
        <span className="font-body font-semibold tracking-normal">{side + 1} / 3</span>
      </div>
      <div
        ref={box}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={(e) => pts.current.delete(e.pointerId)}
        style={cardSheetStyle(color)}
        className={cn(
          "relative min-h-0 flex-1 bg-surface",
          color !== "plain" && "mx-1.5 mt-1.5 rounded-xl",
          zoomable && !overflow ? "touch-none select-none overflow-hidden" : "touch-pan-y overflow-y-auto overscroll-contain",
        )}
      >
        <div
          style={view.s > 1 ? { transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, transformOrigin: "0 0" } : undefined}
        >
          <div ref={content} className={cn("p-2.5", side === 2 && "text-[15px]")}>
            {children}
          </div>
        </div>
        {view.s > 1 ? (
          <button
            type="button"
            onClick={() => setView(RESET)}
            className="absolute right-2 top-2 z-10 rounded-full bg-tag-navy px-2.5 py-1 font-display text-[11px] font-bold text-surface"
          >
            {Math.round(view.s * 100)}% · reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
