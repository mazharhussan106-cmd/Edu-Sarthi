// Owns the anonymized student ID teachers see instead of a name, e.g.
// "STU-7K3Q9P".
//
// It deliberately does NOT look anything up. Uniqueness is enforced by the
// database constraint; callers retry on a collision, which at 30^6 (~729
// million) combinations is rare enough that one retry is plenty.

import { randomInt } from "crypto";

// No 0/O, 1/I/L, or U: a teacher reading an ID aloud to support should not be
// asked "was that a zero or an O".
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generatePublicId(): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[randomInt(0, ALPHABET.length)];
  return `STU-${out}`;
}

/// Falls back to a neutral label for rows the backfill has not reached, rather
/// than leaking the name those rows still have.
export function displayId(publicId: string | null | undefined): string {
  return publicId ?? "STU-······";
}
