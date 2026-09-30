// Owns a labelled row of mutually exclusive options — theme picker, font size,
// practice mode. Built on native radio inputs, so arrow-key navigation and
// screen-reader grouping come for free rather than being reimplemented with
// keydown handlers.
//
// It deliberately does NOT handle more than a handful of options. Past about
// five it should be a <select>, which scrolls and searches on a phone where a
// row of pills just wraps into a mess.

"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  description?: string;
  options: readonly Option<T>[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  description,
  options,
  value,
  onValueChange,
  disabled,
  className,
}: SegmentedControlProps<T>) {
  // One name per instance, or two controls on the same settings page share a
  // radio group and selecting in one clears the other.
  const name = useId();

  return (
    <fieldset className={cn("py-3", className)} disabled={disabled}>
      <legend className="font-body text-sm font-medium text-ink">
        {label}
      </legend>
      {description ? (
        <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-1.5",
                "font-body text-xs font-medium transition-colors",
                // focus-within, because the real input is visually hidden and
                // the outline has to appear on something the user can see.
                "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
                selected
                  ? "bg-accent text-on-accent"
                  : "border border-border text-ink-muted hover:bg-hover hover:text-ink",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onValueChange(option.value)}
                // sr-only, not display:none — a hidden input is unfocusable and
                // drops out of the tab order entirely.
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
