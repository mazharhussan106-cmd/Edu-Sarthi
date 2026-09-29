// Owns the small status pill: submission states, role labels, score bands.
//
// It deliberately does NOT own interaction. A badge that can be clicked or
// dismissed is a button, and needs the focus and keyboard behaviour a <span>
// cannot give it.

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant = "accent" | "neutral" | "success" | "error";

// Alpha on a token, not a hardcoded tint. There is no --color-success-soft, and
// inventing one per theme means five more values to keep in sync; deriving the
// fill from the theme's own success colour stays correct automatically.
const VARIANTS: Record<Variant, string> = {
  accent: "bg-accent/12 text-accent",
  neutral: "bg-paper-dim text-ink-muted",
  success: "bg-success/12 text-success",
  error: "bg-error/12 text-error",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "font-body text-xs font-medium whitespace-nowrap",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
