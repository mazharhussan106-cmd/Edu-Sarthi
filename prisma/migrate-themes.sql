-- Owns the one-off data step for the theme change (Rose and Ocean out, Sepia
-- in). Run it ONCE, before `npx prisma db push`, on any database that already
-- has users:
--
--   npx prisma db execute --file prisma/migrate-themes.sql --schema prisma/schema.prisma
--
-- It deliberately does NOT drop OCEAN from the enum; `prisma db push` does that
-- afterwards, and it can only do so once no row still points at it. Push will
-- then ask for --accept-data-loss: after this script that flag loses nothing,
-- because no row still holds OCEAN.
--
-- What changes for users: Rose was the warm theme, so Rose users land on its
-- replacement, Sepia. Ocean has no successor and those users go back to Light.
-- Nothing else on the row is touched.

ALTER TYPE "Theme" RENAME VALUE 'ROSE' TO 'SEPIA';
UPDATE "User" SET "theme" = 'LIGHT' WHERE "theme" = 'OCEAN';
