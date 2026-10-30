// Owns running the spaced-repetition browser suites: before each suite it
// reseeds the SRS- test rows (seed.cjs), then runs the suite with the deck ids
// the seed printed in IDS, and prints one summary. Pass suite names to run
// some (flashcards, decks); none runs both. Reads .env, like Prisma.
//
// It deliberately does NOT start Postgres or the app, and it does not run
// scripts/srs-unit.ts (no app needed for that); README.md says how.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
  const m = /^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUITES = ["flashcards", "decks"];
const wanted = process.argv.slice(2);
const run = SUITES.filter((s) => wanted.length === 0 || wanted.some((w) => s.startsWith(w)));

const results = [];
for (const suite of run) {
  const ids = execFileSync("node", [path.join(__dirname, "seed.cjs")], { cwd: ROOT }).toString().trim().split("\n").pop();
  console.log(`\n### ${suite}`);
  try {
    execFileSync("node", [path.join(__dirname, `${suite}.cjs`)], { cwd: ROOT, stdio: "inherit", env: { ...process.env, IDS: ids } });
    results.push(`${suite}: passed`);
  } catch {
    results.push(`${suite}: FAILED`);
  }
}
console.log(`\n${results.join("\n")}`);
process.exitCode = results.some((r) => r.endsWith("FAILED")) ? 1 : 0;
