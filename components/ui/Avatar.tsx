// Owns how a person's photo is drawn: the photo in a circle, or their first
// initial when there is none. Every place that shows a person uses this, so a
// missing photo looks the same everywhere.
//
// It deliberately decides nothing about who may see a photo — callers pass a
// URL only when lib/avatar allowed it — and holds no state, so both server and
// client components can render it.

import { cn } from "@/lib/utils";

const SIZES = { sm: "size-8 text-sm", md: "size-12 text-lg", lg: "size-20 text-2xl" } as const;

export function Avatar({
  src,
  name,
  alt,
  size = "md",
  className,
}: {
  src: string | null;
  /// For the initial when there is no photo.
  name: string | null;
  /// Empty when the person's name is already written next to it.
  alt: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const box = cn("shrink-0 rounded-full", SIZES[size], className);
  if (src) {
    // A signed storage URL that changes every view; next/image would cache
    // and resize a file that is already 256×256.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn(box, "border border-border bg-surface object-cover")} />;
  }
  return (
    <span aria-hidden={alt ? undefined : true} role={alt ? "img" : undefined} aria-label={alt || undefined} className={cn(box, "flex items-center justify-center bg-accent/12 font-display font-bold text-accent")}>
      {(name ?? "?").trim().slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}
