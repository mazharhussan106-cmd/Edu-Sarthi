// Owns the small moment when today's goal is done: the tick on the ring pops
// once, the first time the student sees it that day on this device.
//
// Once, not on every visit: a celebration that repeats on each reload is
// noise by the third time. The day is remembered in localStorage, which can
// be missing or blocked (private windows); then the tick simply shows without
// the pop. The Today card is drawn twice (phone and computer columns), so only
// the copy that is actually on screen claims the day. Reduce motion (the
// phone's or Settings') cuts the animation itself in globals.css.

"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function GoalTick({ day }: { day: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    // Hidden by its breakpoint: the other copy is the one being looked at.
    if (!ref.current || ref.current.offsetParent === null) return;
    const key = "goal-done-seen";
    try {
      if (window.localStorage.getItem(key) === day) return;
      window.localStorage.setItem(key, day);
    } catch {
      return;
    }
    setPop(true);
  }, [day]);

  return (
    <span ref={ref} className={pop ? "goal-pop inline-flex" : "inline-flex"}>
      <Check className="h-8 w-8 text-success" strokeWidth={3} />
    </span>
  );
}
