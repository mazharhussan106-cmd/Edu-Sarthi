// Owns the button's visual variants and sizes. It is a plain <button> with
// styling attached — every native prop passes through, so callers can set
// type, disabled, aria-* and onClick as normal.
//
// It deliberately does NOT render links. A button that navigates should be a
// <Link> styled with these same classes, or the keyboard and right-click
// behaviour is wrong and screen readers announce the wrong role.

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  // text-on-accent, never a fixed white: the dark and midnight themes put a
  // light pink in --color-accent, where white text measures under 3:1.
  primary:
    "bg-accent text-on-accent hover:bg-accent-dark disabled:hover:bg-accent",
  outline:
    "border border-border-strong text-ink hover:bg-hover disabled:hover:bg-transparent",
  ghost: "text-ink-muted hover:bg-hover hover:text-ink disabled:hover:bg-transparent",
};

const SIZES: Record<Size, string> = {
  // min-h keeps a tap target usable on a phone even when the label is one word.
  sm: "h-8 min-h-8 px-3 text-xs",
  md: "h-10 min-h-10 px-4 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      // Defaults to "button", not "submit". A styled button inside a form that
      // silently submits is a bug that only shows up on the one form where it
      // was not intended.
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-body font-medium",
        "transition-colors",
        // Disabled stays visible rather than fading to unreadable — the user
        // still needs to read what they cannot press.
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
