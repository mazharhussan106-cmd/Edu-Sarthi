// Owns what the spaced-repetition suites share: signing in the test student,
// one pass / fail line per check, reading a card's state from the database,
// and moving through cards the way a student does.
//
// It deliberately reuses ../library-e2e/lib.cjs for SQL, which refuses any
// database that is not local.

const { chromium } = require("playwright");
const { sql } = require("../library-e2e/lib.cjs");

const BASE = process.env.E2E_BASE || "http://localhost:3000";
let fails = 0;

function check(name, ok, extra = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!ok) fails++;
}

/// "reviews:stage:days until due (India days)" for one card of the student.
function cardState(code) {
  return sql(`SELECT cs.reviews || ':' || cs.stage || ':' || ((cs."dueAt" + interval '5 hours 30 minutes')::date - (now() AT TIME ZONE 'Asia/Kolkata')::date)
    FROM "CardState" cs JOIN "Word" w ON w.id = cs."wordId" JOIN "User" u ON u.id = cs."userId"
    WHERE w.code = '${code}' AND u.email = 'srs-student@test.local'`);
}

async function login(browser) {
  const p = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(e.message));
  await p.goto(`${BASE}/login`);
  await p.getByText("Password", { exact: true }).first().click();
  await p.fill("#email", "srs-student@test.local");
  await p.fill("#password", "Test-pass-123");
  await p.getByRole("button", { name: "Sign in" }).click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
  return p;
}

/// Presses Known or Unknown and waits for the next card's page.
async function answer(p, name) {
  const before = p.url();
  await p.getByRole("button", { name, exact: true }).click();
  await p.waitForURL((u) => u.toString() !== before, { timeout: 15000 });
  await p.waitForLoadState("networkidle");
}

const card = (p) => p.locator('[aria-label*="Enter turns the card"]').first();
/// The word on the card's front, from the card's own label.
async function cardWord(p) {
  return ((await card(p).getAttribute("aria-label").catch(() => null)) || "").split(".")[0].trim().toLowerCase() || null;
}
const isPractice = async (p) => (await p.getByText("Practice · not saved.").count()) > 0;

/// Turns the card to side 3 (Enter turns it, as for a keyboard user).
async function toSide3(p) {
  for (let i = 0; i < 2; i++) {
    await card(p).focus();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(500);
  }
}

function done() {
  console.log(fails ? `\n${fails} FAILED` : "\nall checks passed");
  process.exit(fails ? 1 : 0);
}

module.exports = { chromium, BASE, sql, check, cardState, login, answer, cardWord, isPractice, toSide3, done };
