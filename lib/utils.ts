// Owns the class-name merge helper every component uses to let callers override
// its defaults. `cn("p-6", className)` means a caller passing "p-4" wins,
// instead of both landing in the DOM and the cascade deciding by source order.
//
// It deliberately owns nothing else. This is not a dumping ground for date
// formatters, slugifiers or score helpers — those belong in the file that owns
// that domain, or lib/format.ts when there are enough to justify one.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  // clsx flattens the conditionals; twMerge resolves the conflicts. Without the
  // second step, `cn("bg-surface", "bg-accent")` ships both classes and the
  // winner depends on which one Tailwind happened to emit first.
  return twMerge(clsx(inputs));
}
