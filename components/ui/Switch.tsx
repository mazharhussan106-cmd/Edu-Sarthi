// Owns one settings row: label, description, and the toggle itself. The whole
// row is the control, so the description is clickable too — a 14px toggle is a
// poor tap target on a phone.
//
// It deliberately does NOT persist anything. Saving is the caller's job, which
// keeps this usable for both auto-save settings and unsaved form state.

"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: SwitchProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <p id={labelId} className="font-body text-sm font-medium text-ink">
          {label}
        </p>
        {description ? (
          <p id={descriptionId} className="mt-0.5 text-xs text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        // role="switch" announces "on"/"off" rather than "checked", and
        // aria-labelledby points at the visible text so there is no duplicated
        // label string to drift out of sync.
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-accent" : "bg-paper-dim",
          // The off state needs a border or it vanishes into the page in the
          // high-contrast theme, where paper-dim and surface are near-identical.
          !checked && "border border-border-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform",
            checked
              ? "translate-x-5 bg-on-accent"
              : "translate-x-0 bg-surface",
          )}
        />
      </button>
    </div>
  );
}
