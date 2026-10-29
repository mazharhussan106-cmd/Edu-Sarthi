// Owns a list of mutually exclusive choices inside a sheet: one full-width row
// per option with a radio circle, the way phone settings show a choice.
//
// Built on native radio inputs, like SegmentedControl, so arrow keys and
// screen-reader grouping come for free. It deliberately does NOT save
// anything; the caller applies and saves the choice.

"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export function RadioList<T extends string>({
  label,
  hideLabel = false,
  description,
  options,
  value,
  onValueChange,
}: {
  label: string;
  /** For a sheet with one list, whose title already names it. */
  hideLabel?: boolean;
  description?: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
}) {
  // One name per list, or two lists in one sheet would share a radio group.
  const name = useId();

  return (
    <fieldset>
      <legend className={hideLabel ? "sr-only" : "text-sm font-medium text-ink"}>{label}</legend>
      {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
      <div className={cn("divide-y divide-border rounded-xl border border-border", (!hideLabel || description) && "mt-2")}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-hover",
                // The real input is visually hidden, so the ring goes on the row.
                "focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-accent",
                selected ? "font-medium text-ink" : "text-ink-light",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => onValueChange(o.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-accent" : "border-border-strong",
                )}
              >
                {selected ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
              </span>
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
