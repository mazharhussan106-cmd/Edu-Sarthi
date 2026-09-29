// Owns the password field: show/hide toggle and an advisory strength meter.
//
// The meter is guidance only and never blocks submission. Actual policy lives
// in the Zod schema, enforced server-side — a client-side strength check is a
// hint, not a gate.
//
// It deliberately does NOT do confirm-password matching. That needs both
// fields' values, so it belongs to the form that owns them.

"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Input";
import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes } from "react";

/// Scores length AND character variety. Length alone rates "aaaaaaaaaaaa" as
/// strong; variety alone rates "aA1!" as strong. Both are wrong.
function scorePassword(value: string): number {
  if (!value) return 0;

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;

  const variety =
    Number(/[a-z]/.test(value)) +
    Number(/[A-Z]/.test(value)) +
    Number(/[0-9]/.test(value)) +
    Number(/[^A-Za-z0-9]/.test(value));

  if (variety >= 2) score += 1;
  if (variety >= 3) score += 1;

  // A short password cannot reach the top band on variety alone.
  return value.length < 8 ? Math.min(score, 1) : score;
}

const BANDS = [
  { label: "Too short", bar: "bg-error", text: "text-error" },
  { label: "Weak", bar: "bg-error", text: "text-error" },
  { label: "Fair", bar: "bg-mist", text: "text-ink-muted" },
  { label: "Good", bar: "bg-success", text: "text-success" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
] as const;

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showStrength?: boolean;
}

export function PasswordInput({
  label = "Password",
  showStrength = false,
  className,
  id,
  value,
  onChange,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const meterId = useId();
  const fieldId = id ?? generatedId;

  const text = typeof value === "string" ? value : "";
  const score = scorePassword(text);
  const band = BANDS[score];

  return (
    <div>
      <Label htmlFor={fieldId}>{label}</Label>

      <div className="relative">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          aria-describedby={showStrength && text ? meterId : undefined}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-surface px-3 pr-10",
            "font-body text-sm text-ink placeholder:text-mist",
            "transition-colors hover:border-border-strong",
            "focus:border-accent focus:outline-none",
            "disabled:cursor-not-allowed disabled:bg-paper-dim disabled:opacity-70",
            "aria-[invalid=true]:border-error",
            className,
          )}
          {...props}
        />

        <button
          // type="button" or it submits the form. tabIndex -1 so tabbing goes
          // password → submit, not password → eye → submit; the toggle is a
          // convenience, not a step in the flow.
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute top-0 right-0 flex h-10 w-10 items-center justify-center text-ink-muted hover:text-ink"
        >
          {visible ? (
            <Eye className="h-4 w-4" aria-hidden="true" />
          ) : (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {showStrength && text ? (
        <div className="mt-2">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i < score ? band.bar : "bg-paper-dim",
                )}
              />
            ))}
          </div>
          {/* polite, not assertive: this updates on every keystroke, and
              assertive would interrupt the screen reader continuously. */}
          <p
            id={meterId}
            aria-live="polite"
            className={cn("mt-1 text-xs", band.text)}
          >
            {band.label}
          </p>
        </div>
      ) : null}
    </div>
  );
}
