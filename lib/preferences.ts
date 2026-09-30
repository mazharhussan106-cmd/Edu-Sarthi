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

export const PREFERENCE_SCHEMA = z.object({
  emailOnAudit: z.boolean(),
  autoplayAudit: z.boolean(),
  largerText: z.boolean(),
  cardColor: z.enum(CARD_COLOR_VALUES),
  // Null until the student picks Path A or B on the Chunk tab.
  chunkPath: z.enum(["A", "B"]).nullable(),
});

export type Preferences = z.infer<typeof PREFERENCE_SCHEMA>;

export const DEFAULT_PREFERENCES: Preferences = {
  emailOnAudit: true,
  autoplayAudit: false,
  largerText: false,
  cardColor: "plain" as CardColor,
  chunkPath: null,
};
