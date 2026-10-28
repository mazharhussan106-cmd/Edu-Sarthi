// Owns the "Read-aloud voice" settings: which English accent the phone's voice
// uses for cards, and how fast it speaks.
//
// A choice is stamped on <html> straight away, where lib/speech reads it, so
// the next tap on a card's speaker uses it without a reload. It deliberately
// does NOT test the voice here: whether a phone has a British or American
// voice installed is the phone's business, and lib/speech falls back to any
// English voice it does have.

"use client";

import { useState } from "react";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useSavePreference } from "@/app/(shared)/settings/useSavePreference";
import { VOICE_ACCENTS, VOICE_SPEEDS, type VoiceAccent, type VoiceSpeed } from "@/lib/speech";

export function VoiceSettings({ initialAccent, initialSpeed }: { initialAccent: VoiceAccent; initialSpeed: VoiceSpeed }) {
  const [accent, setAccent] = useState(initialAccent);
  const [speed, setSpeed] = useState(initialSpeed);
  const { save, notice } = useSavePreference();
  const html = () => document.documentElement;

  return (
    <div className="border-t border-border pt-2">
      <SegmentedControl
        label="Read-aloud accent"
        description="The voice that says a card when you press its speaker. Automatic uses Indian English, and British or American for customer-support cards. If your phone has no voice for the accent you pick, it uses another English voice."
        options={VOICE_ACCENTS}
        value={accent}
        onValueChange={(v) => {
          setAccent(v);
          if (v === "auto") html().removeAttribute("data-voice");
          else html().setAttribute("data-voice", v);
          void save("voiceAccent", v);
        }}
      />
      <SegmentedControl
        label="Read-aloud speed"
        description="For the phone's voice. A card with its own recording plays as recorded, and the support cards' Listen and Slow buttons keep their own speed."
        options={VOICE_SPEEDS}
        value={speed}
        onValueChange={(v) => {
          setSpeed(v);
          if (v === "slow") html().setAttribute("data-voice-speed", "slow");
          else html().removeAttribute("data-voice-speed");
          void save("voiceSpeed", v);
        }}
      />
      {notice ? <p aria-live="polite" className="mt-2 text-xs text-ink-muted">{notice}</p> : null}
    </div>
  );
}
