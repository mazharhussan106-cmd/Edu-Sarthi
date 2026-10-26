// Owns the student's "delete my study history" button: a two-step confirm and
// the request. It removes only the list of past answers — the cards' review
// dates and the streak's source are untouched, so studying carries on as before.
//
// Client component because it needs the confirm step and a pending state.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

export function DeleteStudyHistory() {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "busy">("idle");
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setStep("busy");
    setError(null);
    try {
      const res = await fetch("/api/history/study", { method: "DELETE" });
      const text = await res.text();
      let message = "";
      try {
        message = (JSON.parse(text) as { error?: string }).error ?? "";
      } catch {
        // A non-JSON body means a gateway error page, not our route.
      }
      if (!res.ok) throw new Error(message || "Could not delete your history. Check your connection and try again.");
      setStep("idle");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your history. Try again.");
      setStep("confirm");
    }
  }

  if (step === "idle") {
    return (
      <Button variant="outline" size="sm" onClick={() => setStep("confirm")}>
        Delete my study history
      </Button>
    );
  }
  return (
    <div role="group" aria-label="Confirm deleting study history" className="flex flex-col gap-2">
      <p className="text-sm text-ink">This removes the list of every card you answered. It cannot be undone. Your review schedule and streak are not affected.</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={remove} disabled={step === "busy"}>
          {step === "busy" ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setStep("idle")} disabled={step === "busy"}>
          Cancel
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
