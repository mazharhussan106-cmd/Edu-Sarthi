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
// Answering no longer depends on it: lib/srs reads a card's rung from its gap
// with the same bands (rungForGap). What this fixes is the step stored for the
// Review Plan box, which otherwise shows old cards one rung too high.
//
// Usage:
//   npx tsx --env-file=.env scripts/srs-v2-restage.ts           (dry run: counts only)
//   npx tsx --env-file=.env scripts/srs-v2-restage.ts --apply   (writes)

import { Prisma, PrismaClient } from "@prisma/client";

import { RUNG_BANDS } from "../lib/srs";

const prisma = new PrismaClient();

// The same bands answering uses (lib/srs RUNG_BANDS): v1's 1 and 3 both land
// on 3, 7 on 7, and so on; v2's own spread (±2 at most) stays inside each band.
const NEW_STAGE = Prisma.raw(
  `CASE ${RUNG_BANDS.map((edge, i) => `WHEN gap < ${edge} THEN ${i}`).join(" ")} ELSE ${RUNG_BANDS.length} END`,
);

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

  // Every answer has set lastReviewedAt since the first release, so this
  // should be 0; shown so a surprise is seen rather than silently skipped.
  const noGap = await prisma.cardState.count({ where: { reviews: { gt: 0 }, lastReviewedAt: null } });

  const moving = rows.filter((r) => r.from !== r.to).reduce((n, r) => n + r.cards, 0);
  const total = rows.reduce((n, r) => n + r.cards, 0);
  console.log("step now → step after (cards)");
  for (const r of rows) console.log(`  ${r.from} → ${r.to}   ${r.cards}${r.from === r.to ? "  (no change)" : ""}`);
  console.log(`\n${moving} of ${total} answered cards change step.`);
  console.log(`${noGap} answered cards have no last-review time and are left as they are${noGap ? " (look at these by hand)" : ""}.`);

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
