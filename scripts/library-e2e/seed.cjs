// Owns the library tests' data, made on top of the Profile suite's accounts
// (student@, other@, teacher@, admin@test.local): an approved hand-made deck, an
// approved imported-style deck owned by the admin, a pending, a private and a
// link-shared deck (the first two carry a tag that must never show), and 30
// more approved decks that share ONE reviewedAt and 15 topics, so paging has to
// break ties by id. It deletes every deck whose title starts with "E2E " first,
// so it can run again. The last line it prints is the ids the suites need.
//
// LOCAL DATABASE ONLY (lib.cjs refuses anything else). Run scripts/profile-e2e/
// seed.cjs before it; run.cjs does both.

const { PrismaClient } = require("@prisma/client");
const { databaseUrl } = require("./lib.cjs");

databaseUrl();
const p = new PrismaClient();

async function deck(owner, data, cards) {
  const d = await p.deck.create({ data: { ownerId: owner.id, ...data } });
  let n = 0;
  for (const c of cards) {
    n += 1;
    await p.word.create({
      data: {
        code: `${data.title.replace(/\W+/g, "-").toLowerCase()}-${n}`,
        serial: n,
        text: c.front,
        category: c.category ?? null,
        details: { meaning: c.back, example: c.example ?? "", body: "", audit: "" },
        deckId: d.id,
        ownerId: owner.id,
      },
    });
  }
  return d;
}

async function main() {
  const student = await p.user.findUniqueOrThrow({ where: { email: "student@test.local" } });
  const admin = await p.user.findUniqueOrThrow({ where: { email: "admin@test.local" } });
  await p.user.update({ where: { id: student.id }, data: { adultConfirmedAt: new Date(), creditStyle: "DISPLAY_NAME", publicName: "Rahul S." } });
  await p.deck.deleteMany({ where: { title: { startsWith: "E2E " } } });

  const base = { reviewedAt: new Date(), reviewedById: admin.id, termsVersion: "2026-10-27", termsAcceptedAt: new Date() };
  const pub = await deck(student, { title: "E2E Public deck", description: "Ten small words", tags: ["verbs"], visibility: "PUBLIC", status: "APPROVED", licence: "CC-BY-SA-4.0", ...base }, [
    { front: "run", back: "to move fast on foot", example: "I run every day." },
    { front: "walk", back: "to move on foot", example: "We walk to school." },
    { front: "jump", back: "to leave the ground", example: "She can jump high." },
  ]);
  const imported = await deck(admin, { title: "E2E Imported deck", description: "Grouped by topic", tags: ["data"], visibility: "PUBLIC", status: "APPROVED", licence: "EDUSARTHI", ...base }, [
    { front: "SELECT", back: "reads rows", category: "Basics" },
    { front: "WHERE", back: "filters rows", category: "Basics" },
    { front: "JOIN", back: "combines tables", category: "Joins" },
  ]);
  await deck(student, { title: "E2E Pending deck", visibility: "PUBLIC", status: "PENDING_REVIEW", tags: ["secret-tag"] }, [{ front: "pending", back: "waiting" }]);
  await deck(student, { title: "E2E Private deck", visibility: "PRIVATE", status: "DRAFT", tags: ["secret-tag"] }, [{ front: "private", back: "mine" }]);
  await deck(student, { title: "E2E Link deck", visibility: "LINK", status: "DRAFT", shareToken: "e2elinktoken0000000000", tags: [] }, [{ front: "linked", back: "by link" }]);

  // Ten days old, so the decks above stay on page 1 of "Newest".
  const at = new Date(Date.now() - 10 * 86_400_000);
  for (let i = 0; i < 30; i++) {
    const nn = String(i).padStart(2, "0");
    const d = await p.deck.create({
      data: { ownerId: student.id, title: `E2E Bulk ${nn}`, description: `Bulk deck ${nn}`, tags: ["bulk", `topic-${i % 15}`], visibility: "PUBLIC", status: "APPROVED", licence: "CC-BY-SA-4.0", reviewedAt: at, reviewedById: admin.id, termsVersion: "2026-10-27", termsAcceptedAt: at },
    });
    await p.word.create({ data: { code: `e2e-bulk-${nn}-1`, serial: 1, text: `word ${nn}`, details: { meaning: "m", example: "", body: "", audit: "" }, deckId: d.id, ownerId: student.id } });
  }

  const [c1] = await p.word.findMany({ where: { deckId: pub.id }, orderBy: { serial: "asc" }, select: { id: true } });
  const [i1] = await p.word.findMany({ where: { deckId: imported.id }, orderBy: { serial: "asc" }, select: { id: true } });
  console.log(JSON.stringify({ pub: pub.id, imported: imported.id, pubCard: c1.id, impCard: i1.id }));
}

main().finally(() => p.$disconnect());
