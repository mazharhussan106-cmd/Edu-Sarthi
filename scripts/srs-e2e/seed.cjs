// Owns the data the spaced-repetition browser tests need, and nothing else:
// two accounts (srs-student, srs-author), eight built-in words and sixty extra
// ones, an own deck and a followed library deck. Every row it makes has a code
// starting "SRS-" or belongs to those two accounts, and it deletes only those
// before making them again, so a local database with real cards keeps them.
// The built-in test words have negative serials, so a fresh student meets
// them first. Prints the deck ids as JSON on the last line.
//
// It deliberately refuses to run unless DATABASE_URL is a local database
// (../library-e2e/lib.cjs).

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { databaseUrl } = require("../library-e2e/lib.cjs");

databaseUrl();
const p = new PrismaClient();

const WORDS = ["abandon", "brief", "candid", "diligent", "eager", "frugal", "genuine", "humble"];

(async () => {
  await p.word.deleteMany({ where: { code: { startsWith: "SRS-" } } });
  await p.deck.deleteMany({ where: { owner: { email: { in: ["srs-student@test.local", "srs-author@test.local"] } } } });
  await p.user.deleteMany({ where: { email: { in: ["srs-student@test.local", "srs-author@test.local"] } } });

  const hash = await bcrypt.hash("Test-pass-123", 4);
  const mk = (who) => p.user.create({ data: { email: `${who}@test.local`, name: who, emailVerified: new Date(), passwordHash: hash } });
  const student = await mk("srs-student");
  const author = await mk("srs-author");

  for (let i = 0; i < WORDS.length; i++) {
    await p.word.create({
      data: { kind: "WORD", code: `SRS-W-00${i + 1}`, serial: -1000 + i, text: WORDS[i], details: { hindi_meaning: "अर्थ", example: `An example with ${WORDS[i]}.` }, partOfSpeech: "adjective", cefr: "B1" },
    });
  }
  await p.word.createMany({
    data: Array.from({ length: 60 }, (_, i) => ({ kind: "WORD", code: `SRS-X-${String(i + 1).padStart(3, "0")}`, serial: -900 + i, text: `extra${i + 1}`, details: {} })),
  });

  const deck = async (owner, data, prefix, words) => {
    const d = await p.deck.create({ data: { ownerId: owner.id, ...data } });
    for (let i = 0; i < words.length; i++) {
      await p.word.create({ data: { code: `${prefix}-${i + 1}`, serial: i + 1, text: words[i], details: { meaning: `meaning of ${words[i]}`, example: "", body: "", audit: "" }, deckId: d.id, ownerId: owner.id } });
    }
    return d;
  };
  const own = await deck(student, { title: "SRS E2E own deck", visibility: "PRIVATE", status: "DRAFT" }, "SRS-OWN", ["apple", "banana", "cherry", "date", "elder", "fig"]);
  const at = new Date();
  const lib = await deck(
    author,
    { title: "SRS E2E library deck", description: "Six words", tags: ["srs-e2e"], visibility: "PUBLIC", status: "APPROVED", licence: "CC-BY-SA-4.0", reviewedAt: at, termsVersion: "2026-10-27", termsAcceptedAt: at },
    "SRS-LIB",
    ["lion", "mango", "night", "ocean", "pearl", "quiet"],
  );
  await p.deckFollow.create({ data: { userId: student.id, deckId: lib.id } });
  console.log(JSON.stringify({ own: own.id, lib: lib.id }));
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
