// Owns running the library tests: before each suite it reseeds the Profile
// accounts and the library decks (seed.cjs), then runs the suite with the ids
// the seed printed in IDS, and prints one summary. Pass suite names to run some
// (open, seo, browse, browse-ui, hostile, consent); none runs all. Reads
// DATABASE_URL from .env, like Prisma.
//
// It deliberately does NOT start Postgres or the app, and it does not run
// `unit.ts` (that needs no app: `npx tsx scripts/library-e2e/unit.ts`);
// README.md says how.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
  const m = /^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUITES = ["open-and-nav", "seo", "browse", "browse-ui", "hostile", "consent"];
const wanted = process.argv.slice(2);
const run = SUITES.filter((s) => wanted.length === 0 || wanted.some((w) => s.startsWith(w)));

const results = [];
for (const suite of run) {
  console.log(`\n=== ${suite}`);
  execFileSync(process.execPath, [path.join(ROOT, "scripts/profile-e2e/seed.cjs")], { stdio: "inherit", env: process.env });
  const out = execFileSync(process.execPath, [path.join(__dirname, "seed.cjs")], { env: process.env }).toString();
  const ids = out.trim().split("\n").pop();
  try {
    execFileSync(process.execPath, [path.join(__dirname, `${suite}.cjs`)], { stdio: "inherit", env: { ...process.env, IDS: ids } });
    results.push(`PASS ${suite}`);
  } catch {
    results.push(`FAIL ${suite}`);
  }
}
console.log(`\n${results.join("\n")}`);
process.exitCode = results.some((r) => r.startsWith("FAIL")) ? 1 : 0;
