// Owns reading a card aloud with the phone's own voice: which voice, how fast,
// and the student's "Read-aloud voice" settings that decide both.
//
// The settings are read from <html> at the moment of speaking (data-voice,
// data-voice-speed, stamped by PrefSync and by Settings), the same way the
// recorder reads data-saver. Every card screen speaks through here, so none of
// them needs the preference handed down as a prop.
//
// It deliberately does NOT play recorded audio. A card with its own recording
// plays that; this is the fallback until recordings exist.

export const VOICE_ACCENTS = [
  { value: "auto", label: "Automatic" },
  { value: "en-IN", label: "Indian" },
  { value: "en-GB", label: "British" },
  { value: "en-US", label: "American" },
] as const;
export const VOICE_ACCENT_VALUES = ["auto", "en-IN", "en-GB", "en-US"] as const;
export type VoiceAccent = (typeof VOICE_ACCENT_VALUES)[number];

export const VOICE_SPEEDS = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
] as const;
export const VOICE_SPEED_VALUES = ["slow", "normal"] as const;
export type VoiceSpeed = (typeof VOICE_SPEED_VALUES)[number];

/// Normal is the rate the cards have always used; slow matches the support
/// card's Slow button.
const RATE: Record<VoiceSpeed, number> = { slow: 0.6, normal: 0.85 };

/// Says `text` aloud. `prefer` is the card's own accent order when the student
/// left the accent on Automatic; `rate` is for buttons that name their own
/// speed (the support card's Listen and Slow). Returns false when this phone
/// cannot speak at all, so the caller can say so.
export function sayText(text: string, opts: { prefer?: readonly string[]; rate?: number } = {}): boolean {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth) return false;

  const html = document.documentElement.dataset;
  const chosen = VOICE_ACCENT_VALUES.find((a) => a === html.voice);
  const order = chosen && chosen !== "auto" ? [chosen] : (opts.prefer ?? ["en-IN"]);
  const voices = synth.getVoices();

  const u = new SpeechSynthesisUtterance(text);
  // A phone without the chosen accent still speaks, in whatever English voice
  // it has, rather than staying silent.
  u.voice = order.map((l) => voices.find((v) => v.lang === l)).find(Boolean) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
  u.lang = u.voice?.lang ?? order[0];
  u.rate = opts.rate ?? RATE[html.voiceSpeed === "slow" ? "slow" : "normal"];
  synth.cancel();
  synth.speak(u);
  return true;
}
