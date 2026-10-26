// Owns the "AI-assisted" label shown on a card or a deck the AI helped make.
// One component so the wording and the look are the same everywhere it appears.
//
// It deliberately says "assisted", not "generated": the person read, may have
// edited, and chose to keep the card, so it is made with AI help, not by AI alone.

import { Badge } from "@/components/ui/Badge";

export function AiBadge({ label = "AI-assisted" }: { label?: string }) {
  return <Badge variant="accent" title="Made with AI help. Check important info.">{label}</Badge>;
}
