// Owns the "Read-aloud voice" row in Settings → Flashcards and its sheet:
// which English accent the phone's voice uses for cards, and how fast it
// speaks. Both live in one sheet because they describe one voice.
//
// A choice is stamped on <html> straight away, where lib/speech reads it, so
// the next tap on a card's speaker uses it without a reload. It deliberately
// does NOT test the voice here: whether a phone has a British or American
// voice installed is the phone's business, and lib/speech falls back to any
// English voice it does have.

"use client";

import { useState } from "react";

import { RadioList } from "@/components/ui/RadioList";
import { SheetRow } from "@/components/ui/SheetRow";
import { useSavePreference } from "@/app/(shared)/settings/useSavePreference";
import { VOICE_ACCENTS, VOICE_SPEEDS, type VoiceAccent, type VoiceSpeed } from "@/lib/speech";

export function VoiceSettings({ initialAccent, initialSpeed }: { initialAccent: VoiceAccent; initialSpeed: VoiceSpeed }) {
  const [accent, setAccent] = useState(initialAccent);
  const [speed, setSpeed] = useState(initialSpeed);
  const { save, notice } = useSavePreference();
  const html = () => document.documentElement;
  const label = (list: readonly { value: string; label: string }[], v: string) => list.find((o) => o.value === v)?.label ?? "";

  return (
    <SheetRow
      title="Read-aloud voice"
      subline="The voice a card's speaker button uses."
      // The speed is named only when it is not the usual one, so the value stays short.
      value={speed === "slow" ? `${label(VOICE_ACCENTS, accent)} · Slow` : label(VOICE_ACCENTS, accent)}
      done
    >
      <div className="flex flex-col gap-5">
        <RadioList
          label="Accent"
          description="Automatic uses Indian English, and British or American for customer-support cards. If your phone has no voice for the accent you pick, it uses another English voice."
          options={VOICE_ACCENTS}
          value={accent}
          onValueChange={(v) => {
            setAccent(v);
            if (v === "auto") html().removeAttribute("data-voice");
            else html().setAttribute("data-voice", v);
            void save("voiceAccent", v);
          }}
        />
        <RadioList
          label="Speed"
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
      </div>
      {notice ? <p aria-live="polite" className="mt-2 text-xs text-error">{notice}</p> : null}
    </SheetRow>
  );
}
