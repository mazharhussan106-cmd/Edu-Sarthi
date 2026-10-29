// Owns the My goal sheet: what the student is practising for, their own pick
// of level, and the day it is for. Each choice saves the moment it is made,
// through the same preferences route as Settings, like every other choice
// sheet; the date saves once it is a whole, allowed date.
//
// Goal and level are self-described: teachers never see them and nothing is
// graded from them. It deliberately does NOT set the new-cards-a-day number; that is
// a flashcard setting and stays in Settings.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { RadioList } from "@/components/ui/RadioList";
import { Sheet } from "@/components/ui/Sheet";
import { goalDateLimits, goalDateProblem } from "@/lib/goalDate";
import { GOALS, LEVELS } from "@/lib/preferences";

type Key = "goal" | "level" | "goalDate";

export function GoalEditor({ goal, level, goalDate }: { goal: string; level: string; goalDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ goal, level, goalDate });
  const [typed, setTyped] = useState(goalDate);
  const [note, setNote] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  // "Set your goal" in Get started links to #my-goal, which opens this sheet.
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#my-goal") setOpen(true);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

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
      if (!res.ok) {
        // The route explains a refused date; anything else gets the general line.
        let message = "That did not save. Try again.";
        try {
          message = (JSON.parse(await res.text()) as { error?: string }).error ?? message;
        } catch {}
        setState((s) => ({ ...s, [key]: before }));
        if (key === "goalDate") setTyped(before);
        setNote(message);
        return;
      }
      setChanged(true);
    } catch {
      // Put the old choice back, so the sheet never shows what was not saved.
      setState((s) => ({ ...s, [key]: before }));
      if (key === "goalDate") setTyped(before);
      setNote("That did not save. Check your connection and try again.");
    }
  }

  // A date input reports "" while a date is half typed on a computer, so only
  // a whole date is checked and saved; clearing is its own button.
  function pickDate(value: string) {
    setTyped(value);
    if (value === "" || value === state.goalDate) return;
    const problem = goalDateProblem(value);
    if (problem) {
      setNote(problem);
      return;
    }
    void save("goalDate", value);
  }

  const limits = goalDateLimits();

  function close() {
    setOpen(false);
    setNote(null);
    // So a reload does not open the sheet again; router state is kept.
    if (window.location.hash === "#my-goal") {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
    setTyped(state.goalDate);
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
          <div>
            <Label htmlFor="goal-date" className="text-sm text-ink">
              Target date (optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="goal-date"
                type="date"
                min={limits.min}
                max={limits.max}
                value={typed}
                onChange={(e) => pickDate(e.target.value)}
                aria-describedby="goal-date-note"
                className="min-w-0 flex-1"
              />
              {state.goalDate ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTyped("");
                    void save("goalDate", "");
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
            <p id="goal-date-note" className="mt-1.5 text-xs text-ink-muted">
              Your exam or interview day. The profile counts the days down.
            </p>
          </div>
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
