// Owns the text input and its label. Two exports in one file because a bare
// input is never correct — every field needs a label pointing at it, and
// keeping them together makes forgetting one harder.
//
// It deliberately does NOT own field-level error text or layout. Error copy is
// the form's job: it decides when to show it, and every field wrapped in a
// component that renders errors ends up fighting that component's opinion.

"use client";

import { cn } from "@/lib/utils";
import { useId, type InputHTMLAttributes, type LabelHTMLAttributes } from "react";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-body text-xs font-medium text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  // Generated only as a fallback. A caller that passes an id keeps it, because
  // the label's htmlFor has to match and the caller usually owns both.
  const generatedId = useId();

  return (
    <input
      id={id ?? generatedId}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3",
        "font-body text-sm text-ink",
        // Placeholder is mist, not ink-muted: it must read as absent-value
        // text, distinct from a label, without dropping below legibility.
        "placeholder:text-mist",
        "transition-colors",
        "hover:border-border-strong",
        // The global :focus-visible outline covers keyboard focus. This adds
        // the border change, which fires on click too — a click-focused field
        // still needs to look focused.
        "focus:border-accent focus:outline-none",
        "disabled:cursor-not-allowed disabled:bg-paper-dim disabled:opacity-70",
        // aria-invalid drives the error colour, so the form sets one attribute
        // and gets both the visual state and the screen-reader announcement.
        "aria-[invalid=true]:border-error",
        className,
      )}
      {...props}
    />
  );
}
