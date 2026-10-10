// Owns the shape of the user preferences Json column: the allowlist of keys
// this app understands, and their defaults.
//
// It lives in lib/ rather than beside the route handler so that a client
// component can import DEFAULT_PREFERENCES without dragging Prisma and Auth.js
// into the browser bundle.
//
// A key absent from here is rejected on write. Otherwise the Json column
// becomes a dumping ground that nothing can safely read back.

import { z } from "zod";

import { CARD_COLOR_VALUES, type CardColor } from "@/lib/cardColors";
import { TEXT_SIZE_VALUES } from "@/lib/textSize";

export const PREFERENCE_SCHEMA = z.object({
  emailOnAudit: z.boolean(),
  autoplayAudit: z.boolean(),
  // Replaces the old largerText boolean, which no page ever read. A stored
  // largerText key is simply ignored and the user starts at "normal".
  textSize: z.enum(TEXT_SIZE_VALUES),
  cardColor: z.enum(CARD_COLOR_VALUES),
});

export type Preferences = z.infer<typeof PREFERENCE_SCHEMA>;

export const DEFAULT_PREFERENCES: Preferences = {
  emailOnAudit: true,
  autoplayAudit: false,
  textSize: "normal",
  cardColor: "plain" as CardColor,
};
