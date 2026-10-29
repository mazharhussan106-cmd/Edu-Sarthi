// Owns what every Profile browser test shares: signing in as a test account,
// a PASS/FAIL line per check, and an axe accessibility run in any theme (the
// theme is saved on the account, because the app puts it back on <html>).
//
// It deliberately does NOT start the app or the database; README.md says how.

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.PROFILE_E2E_BASE || "http://localhost:3000";
const ROOT = path.resolve(__dirname, "../..");
const FIXTURES = path.join(__dirname, "fixtures");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const THEMES = { light: "LIGHT", dark: "DARK", sepia: "SEPIA", midnight: "MIDNIGHT", "high-contrast": "HIGH_CONTRAST" };

let fails = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!ok) fails++;
}

async function login(browser, who, width = 390) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 } });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(e.message));
  await p.goto(`${BASE}/login`);
  await p.getByText("Password", { exact: true }).first().click();
  await p.fill("#email", `${who}@test.local`);
  await p.fill("#password", "Test-pass-123");
  await p.getByRole("button", { name: "Sign in" }).click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
  return p;
}

async function setTheme(p, t) {
  await p.evaluate(async (v) => {
    await fetch("/api/profile/theme", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: v }) });
  }, THEMES[t]);
}

/// Runs axe (WCAG 2.1 AA and best practice) in each theme. `before` opens a
/// sheet after each reload. The logotype's contrast and the header's two
/// unlabelled navs are known on every page and are not counted here.
async function axe(p, label, themes = Object.keys(THEMES), before) {
  for (const t of themes) {
    await setTheme(p, t);
    await p.reload({ waitUntil: "networkidle" });
    if (before) await before(p);
    await p.waitForTimeout(600);
    const attr = await p.evaluate(() => document.documentElement.getAttribute("data-theme") || "light");
    await p.addScriptTag({ content: AXE }).catch(() => {});
    const found = await p.evaluate(async () => {
      const res = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] });
      return res.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes.slice(0, 3).map((n) => n.html.slice(0, 90)).join(" | ")}`);
    });
    const mine = found
      .map((x) => x.replace(/<a class="font-display text-lg font-bold text-brand[^|]*\|?|<p class="font-display text-base font-bold text-brand">EduSarthi<\/p>\s*\|?/g, ""))
      .filter((x) => !/^landmark-unique|^color-contrast\(\d+\):\s*$/.test(x));
    check(`axe ${label} [${t}${attr !== t ? ` got ${attr}` : ""}]`, mine.length === 0 && attr === t, mine.join(" ; "));
  }
  await setTheme(p, "light");
  await p.reload({ waitUntil: "networkidle" });
}

function done() {
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exitCode = fails ? 1 : 0;
}

module.exports = { chromium, BASE, ROOT, FIXTURES, check, login, axe, done };
