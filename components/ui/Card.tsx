// Owns the card surface and its header pieces: Card, CardHeader, CardTitle.
// Three exports in one file because they are never used apart, and splitting
// them would mean three imports at every call site for one visual unit.
//
// It deliberately does NOT own a CardFooter or CardContent. Body content goes
// straight inside <Card> with whatever spacing that page needs — a wrapper
// that only adds a div is a component that has to be maintained for nothing.

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // surface, not paper: cards sit on the page background and need to be
        // distinguishable from it in every theme, including high contrast
        // where both are white and only the border separates them.
        "rounded-xl border border-border bg-surface p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // Row layout with space-between so a title and an action button sit at
      // opposite ends without the caller writing flex classes every time.
      className={cn(
        "mb-4 flex items-start justify-between gap-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-display text-base font-bold text-ink",
        className,
      )}
      {...props}
    />
  );
}
