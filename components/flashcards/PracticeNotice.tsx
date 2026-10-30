// Owns the one line above a card shown again as practice after Unknown
// (lib/cardAgain). Outside the card on purpose: every card keeps the one
// EduSarthi look. It deliberately does not decide when a card is practice;
// the session page does.

export function PracticeNotice() {
  return (
    <p role="status" className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs text-ink">
      <b className="font-display">Practice · not saved.</b> Cards you mark Unknown come round once more like this.
      Known or Unknown here only moves on; this card&apos;s review date does not change.
    </p>
  );
}
