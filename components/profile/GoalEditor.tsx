// Owns the My goal sheet: what the student is practising for and their own
// pick of level. Each choice saves the moment it is made, through the same
// preferences route as Settings, like every other choice sheet.
//
// Both are self-described: teachers never see them and nothing is graded
// from them. It deliberately does NOT set the new-cards-a-day number; that is
// a flashcard setting and stays in Settings.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RadioList } from "@/components/ui/RadioList";
import { Sheet } from "@/components/ui/Sheet";
import { GOALS, LEVELS } from "@/lib/preferences";

type Key = "goal" | "level";

export function GoalEditor({ goal, level }: { goal: string; level: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ goal, level });
  const [note, setNote] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  async function save(key: Key, value: string) {
    const before = state[key];
    setState((s) => ({ ...s, [key]: value }));
    setNote(null);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
      setChanged(true);
    } catch {
      // Put the old choice back, so the sheet never shows what was not saved.
      setState((s) => ({ ...s, [key]: before }));
      setNote("That did not save. Check your connection and try again.");
    }
  }

  function close() {
    setOpen(false);
    setNote(null);
    if (changed) router.refresh();
    setChanged(false);
  }

  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className="rounded-md text-sm font-medium text-accent-dark hover:underline">
        Edit<span className="sr-only"> my goal</span> ›
      </button>
      <Sheet open={open} onClose={close} title="My goal" done>
        <div className="flex flex-col gap-5">
          <RadioList label="What I am practising for" options={GOALS} value={state.goal} onValueChange={(v) => void save("goal", v)} />
          <RadioList
            label="My English level"
            description="Your own pick. It is not a test result, and teachers do not see it."
            options={LEVELS}
            value={state.level}
            onValueChange={(v) => void save("level", v)}
          />
          <p className="text-xs text-ink-muted">New cards a day is in Settings → Flashcards.</p>
          {note ? (
            <p role="alert" className="text-xs text-error">
              {note}
            </p>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
