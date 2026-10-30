// Owns the one-time move of every card's ladder step from the v1 ladder
// (1 · 3 · 7 · 15 · 30 · 60) to the v2 ladder (3 · 7 · 15 · 30 · 60 · 120 · 180).
// Without it a card stored on "60 days" (step 6 of 6) would read as step 6 of
// 7, which is now 120 days. See docs/SRS-V2-PLAN.md.
//
// The new step comes from the gap the card was actually given (dueAt −
// lastReviewedAt), matched to the nearest v2 rung, not from "step − 1". That
// makes it safe to run twice: a card already on v2 maps to the step it is on.
//
// It rewrites CardState.stage only. dueAt, known, remarks, notes and the
// history (ReviewLog) are not touched, so a card keeps the date it already
// has. Cards never answered (remark or note only) have no gap and are skipped.
//
// Usage:
//   npx tsx --env-file=.env scripts/srs-v2-restage.ts           (dry run: counts only)
//   npx tsx --env-file=.env scripts/srs-v2-restage.ts --apply   (writes)

import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Midpoints between neighbouring v2 rungs (3|7 → 5, 7|15 → 11, …). v1's 1 and
// 3 both land on 3, 7 on 7, and so on; v2's own spread (±2 at most) stays
// well inside each band.
const NEW_STAGE = Prisma.sql`
  CASE
    WHEN gap < 5 THEN 0
    WHEN gap < 11 THEN 1
    WHEN gap < 22.5 THEN 2
    WHEN gap < 45 THEN 3
    WHEN gap < 90 THEN 4
    WHEN gap < 150 THEN 5
    ELSE 6
  END`;

const GAPS = Prisma.sql`
  SELECT "id", "stage",
         EXTRACT(EPOCH FROM ("dueAt" - "lastReviewedAt")) / 86400.0 AS gap
  FROM "CardState"
  WHERE "reviews" > 0 AND "lastReviewedAt" IS NOT NULL`;

async function main() {
  const apply = process.argv.includes("--apply");

  const rows = await prisma.$queryRaw<{ from: number; to: number; cards: number }[]>(Prisma.sql`
    SELECT "stage" AS "from", (${NEW_STAGE})::int AS "to", COUNT(*)::int AS cards
    FROM (${GAPS}) g
    GROUP BY 1, 2
    ORDER BY 1, 2`);

  const moving = rows.filter((r) => r.from !== r.to).reduce((n, r) => n + r.cards, 0);
  const total = rows.reduce((n, r) => n + r.cards, 0);
  console.log("step now → step after (cards)");
  for (const r of rows) console.log(`  ${r.from} → ${r.to}   ${r.cards}${r.from === r.to ? "  (no change)" : ""}`);
  console.log(`\n${moving} of ${total} answered cards change step.`);

  if (!apply) {
    console.log("Dry run: nothing written. Run again with --apply to write.");
    return;
  }

  const changed = await prisma.$executeRaw(Prisma.sql`
    UPDATE "CardState" cs
    SET "stage" = (${NEW_STAGE})
    FROM (${GAPS}) g
    WHERE cs."id" = g."id" AND cs."stage" <> (${NEW_STAGE})`);
  console.log(`Written: ${changed} cards.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
