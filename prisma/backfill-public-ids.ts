// One-off: gives every user created before the publicId column existed an
// anonymized ID. Safe to run twice — it only touches rows where it is null.
//
// Run with:  npx tsx prisma/backfill-public-ids.ts

import { PrismaClient } from "@prisma/client";

import { generatePublicId } from "../lib/publicId";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { publicId: null }, select: { id: true } });
  for (const u of users) {
    // Retry on the rare collision with the unique constraint.
    for (let attempt = 0; ; attempt++) {
      try {
        await prisma.user.update({ where: { id: u.id }, data: { publicId: generatePublicId() } });
        break;
      } catch (err) {
        if (attempt >= 3) throw err;
      }
    }
  }
  console.log(`Backfilled ${users.length} user(s).`);
}

main().finally(() => prisma.$disconnect());
