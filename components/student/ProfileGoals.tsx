// Owns the level and goal pickers on the profile.
//
// They are self-described and used only to remind the student what they are
// working towards. Teachers do not see them and nothing is graded from them.
// Saves through the same preferences route as Settings, one PATCH per change.

"use client";

import { useState } from "react";

import { GOALS, LEVELS } from "@/lib/preferences";

const select = "mt-1 h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink focus:border-accent";

export function ProfileGoals({ level, goal }: { level: string; goal: string }) {
  const [state, setState] = useState({ level, goal });
  const [note, setNote] = useState<string | null>(null);

  async function save(key: "level" | "goal", value: string) {
    setState((s) => ({ ...s, [key]: value }));
    setNote(null);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      setNote(res.ok ? "Saved." : "That did not save. Check your connection and try again.");
    } catch {
      setNote("That did not save. Check your connection and try again.");
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="profile-level" className="text-xs font-medium text-ink">My English level</label>
        <select id="profile-level" value={state.level} onChange={(e) => void save("level", e.target.value)} className={select}>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="profile-goal" className="text-xs font-medium text-ink">What I am practising for</label>
        <select id="profile-goal" value={state.goal} onChange={(e) => void save("goal", e.target.value)} className={select}>
          {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </div>
      {note ? <p aria-live="polite" className="text-xs text-ink-muted sm:col-span-2">{note}</p> : null}
    </div>
  );
}
