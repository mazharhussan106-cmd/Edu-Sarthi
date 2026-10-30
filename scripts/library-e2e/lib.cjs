// Owns what the library tests share: the check that the database is local, and
// a synchronous SQL helper. A suite changes a deck's status and reads the page
// on the next line, so the helper waits for psql instead of returning a promise.
//
// It deliberately does NOT connect to anything but a local database: these
// tests delete and remake decks, accounts and announcements.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function databaseUrl() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    const env = fs.readFileSync(path.resolve(__dirname, "../../.env"), "utf8");
    url = (/^\s*DATABASE_URL\s*=\s*"?([^"\n]*)"?\s*$/m.exec(env) || [])[1];
  }
  if (!url || !/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    throw new Error("Refusing to run: DATABASE_URL is not a local database.");
  }
  // psql takes the connection URL but not Prisma's extra query parameters.
  return url.split("?")[0];
}

function sql(query) {
  return execFileSync("psql", [databaseUrl(), "-tAc", query]).toString().trim();
}

module.exports = { sql, databaseUrl };
