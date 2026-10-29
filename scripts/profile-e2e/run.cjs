// Owns running the Profile browser tests: before each suite it reseeds the
// test accounts (seed.cjs), so no suite depends on what another left behind,
// then runs it and prints one summary. Pass suite names (p1 … p6) to run
// some; none runs all. Reads DATABASE_URL from .env, like Prisma.
//
// It deliberately does NOT start Postgres or the app; README.md says how.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
  const m = /^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUITES = ["p1-layout", "p2-scores-calendar", "p3-goal-date", "p4-staff", "p5-photo", "p6-share-badges"];
const wanted = process.argv.slice(2);
const run = SUITES.filter((s) => wanted.length === 0 || wanted.some((w) => s.startsWith(w)));

const results = [];
for (const suite of run) {
  console.log(`\n=== ${suite}`);
  execFileSync(process.execPath, [path.join(__dirname, "seed.cjs")], { stdio: "inherit", env: process.env });
  try {
    execFileSync(process.execPath, [path.join(__dirname, `${suite}.cjs`)], { stdio: "inherit", env: process.env });
    results.push(`PASS ${suite}`);
  } catch {
    results.push(`FAIL ${suite}`);
  }
}
console.log(`\n${results.join("\n")}`);
process.exitCode = results.some((r) => r.startsWith("FAIL")) ? 1 : 0;
