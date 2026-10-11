// Owns sizing a card side's text so the whole side fits its box with no
// scrolling: it tries font sizes between MIN and MAX and keeps the largest one
// that fits. Every length inside a side is written in `em`, so one number
// scales the word, the labels and the sentences together — a short word gets
// big type, a word with long examples gets smaller type.
//
// It deliberately does NOT zoom. Pinch zoom is a transform on top of this,
// so the student's zoom survives a re-fit and a re-fit never fights a pinch.
//
// If even MIN does not fit (a very long sheet row on a very small phone) it
// reports `overflow` and the caller lets the side scroll. Hiding the rest
// would silently lose content.

"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

import { cardFloorScale } from "@/lib/textSize";

const DEFAULT_MIN_PX = 8;
const MAX_PX = 17;

export function useFitFont(
  box: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
  active: boolean,
  key: unknown,
  // Side 2 is dense; letting it shrink to 8px made it unreadable, so it asks
  // for a higher floor and scrolls instead of shrinking further.
  minPx: number = DEFAULT_MIN_PX,
): { overflow: boolean } {
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const b = box.current;
    const c = content.current;
    if (!b || !c) return;
    // The same element carries every side, so a size fitted for side 2 must
    // not leak onto side 3, which sets its own.
    if (!active) {
      c.style.fontSize = "";
      setOverflow(false);
      return;
    }

    function fit() {
      if (!b || !c) return;
      // Read at fit time, not render time: the attribute is on <html>, outside
      // React, and changes with the setting.
      const scale = cardFloorScale(document.documentElement.dataset.text);
      const floor = minPx * scale;
      const fits = (px: number) => {
        c.style.fontSize = `${px}px`;
        return c.scrollHeight <= b.clientHeight;
      };
      if (fits(MAX_PX * scale)) return setOverflow(false);
      let lo = floor;
      let hi = MAX_PX * scale;
      // Seven halvings get within 0.1px, finer than a phone can render.
      for (let i = 0; i < 7; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid;
        else hi = mid;
      }
      setOverflow(!fits(lo));
    }

    fit();
    // Rotating the phone, the address bar hiding, and the web font arriving
    // after first paint all change what fits.
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [box, content, active, key, minPx]);

  return { overflow };
}
