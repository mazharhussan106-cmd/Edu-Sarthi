// Owns the checks that click through the library list as a visitor and as a
// student, at phone and computer width: a topic, Next and Previous, a search
// inside a topic, All topics, the keyboard on the "More topics" fold, no
// sideways scroll, and axe in five themes.
//
// It deliberately does NOT start the app or the database; README.md says how.

const { chromium, BASE, check, login, done } = require("../profile-e2e/lib.cjs");
const fs = require("fs");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

async function axeRun(p, label) {
  for (const theme of ["light", "dark", "sepia", "midnight", "high-contrast"]) {
    await p.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await p.waitForTimeout(500); // buttons and chips have colour transitions
    await p.addScriptTag({ content: AXE }).catch(() => {});
    const found = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] })).violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`));
    // Known on every page: the logotype's contrast (docs/PROJECT-MEMORY.md).
    const mine = found.filter((x) => x !== "color-contrast(2): .text-lg | .text-base");
    check(`axe ${label} [${theme}]`, mine.length === 0, mine.join(" ; "));
  }
  await p.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
}

const noSideways = (p) => p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const deckCount = (p) => p.$$eval('main ul > li a[href^="/library/"]', (a) => a.length);

async function run(p, who, width) {
  const tag = `${who} ${width}px`;
  await p.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  check(`${tag}: no sideways scroll`, await noSideways(p));
  check(`${tag}: 24 decks and a pager`, (await deckCount(p)) === 24 && (await p.getByRole("navigation", { name: "Pages" }).count()) === 1);

  // Click a topic.
  await p.getByRole("navigation", { name: "Topics" }).getByRole("link", { name: /^bulk\s*30$/ }).click();
  await p.waitForURL(/tag=bulk/);
  await p.getByText("30 decks match").waitFor();
  check(`${tag}: clicking 'bulk' filters to 30 decks, 24 shown`, (await deckCount(p)) === 24);
  check(`${tag}: the chosen topic is marked`, (await p.locator('nav[aria-label="Topics"] a[aria-current="true"]').innerText()).startsWith("bulk"));

  // Next page keeps the topic.
  await p.getByRole("link", { name: "Next →" }).click();
  await p.waitForURL(/page=2/);
  await p.getByText("2 / 2").waitFor();
  check(`${tag}: Next goes to page 2 of bulk (6 decks), URL keeps the topic`, (await deckCount(p)) === 6 && /tag=bulk/.test(p.url()) && /page=2/.test(p.url()));
  await p.getByRole("link", { name: "← Previous" }).click();
  await p.waitForURL((u) => !u.search.includes("page="));
  check(`${tag}: Previous drops page=1 from the URL`, !/page=/.test(p.url()) && /tag=bulk/.test(p.url()));

  // Search inside the topic.
  await p.fill("#lib-search", "Bulk 07");
  await p.keyboard.press("Enter");
  await p.waitForURL(/q=Bulk/);
  await p.getByText("1 deck matches").waitFor();
  check(`${tag}: search inside a topic: '1 deck matches'`, (await deckCount(p)) === 1 && /tag=bulk/.test(p.url()));

  // All topics clears the topic but keeps the search.
  await p.getByRole("navigation", { name: "Topics" }).getByRole("link", { name: "All topics" }).click();
  await p.waitForURL((u) => !u.search.includes("tag="));
  check(`${tag}: All topics clears the topic, keeps the search`, /q=Bulk/.test(p.url()) && !/tag=/.test(p.url()));

  // The fold, with the keyboard.
  await p.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  const summary = p.locator("nav[aria-label='Topics'] summary");
  check(`${tag}: the fold is closed at first`, (await p.locator("nav[aria-label='Topics'] details[open]").count()) === 0);
  await summary.focus();
  await p.keyboard.press("Enter");
  check(`${tag}: Enter on 'More topics' opens it`, (await p.locator("nav[aria-label='Topics'] details[open]").count()) === 1);
  check(`${tag}: its summary names the count`, /More topics \(10\)/.test(await summary.innerText()));
  await p.keyboard.press("Enter");
  check(`${tag}: and Enter closes it again`, (await p.locator("nav[aria-label='Topics'] details[open]").count()) === 0);
}

(async () => {
  const b = await chromium.launch();

  // ---- signed out ----
  for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 } });
    const p = await ctx.newPage();
    p.errors = [];
    p.on("pageerror", (e) => p.errors.push(e.message));
    await run(p, "visitor", w);
    check(`visitor ${w}px: no page errors`, p.errors.length === 0, p.errors.join(" | "));
    if (w === 390) {
      await p.goto(`${BASE}/library`, { waitUntil: "networkidle" });
      await p.goto(`${BASE}/library?tag=bulk&page=2`, { waitUntil: "networkidle" });
      await p.goto(`${BASE}/library`, { waitUntil: "networkidle" });
      await axeRun(p, "list, signed out");
      await p.goto(`${BASE}/library?tag=bulk&page=2`, { waitUntil: "networkidle" });
      await axeRun(p, "topic page 2, signed out");
      await p.goto(`${BASE}/library?tag=verbs`, { waitUntil: "networkidle" });
      check("visitor: a folded topic opens the fold on load", (await p.locator("nav[aria-label='Topics'] details[open]").count()) === 1);
      await axeRun(p, "folded topic open, signed out");
      await p.goto(`${BASE}/library?q=zzzzzzzz`, { waitUntil: "networkidle" });
      await axeRun(p, "no result, signed out");
    }
  }

  // ---- signed in ----
  for (const w of [390, 1280]) {
    const p = await login(b, "other", w);
    await run(p, "student", w);
    check(`student ${w}px: no page errors`, p.errors.length === 0, p.errors.join(" | "));
    if (w === 390) {
      await p.goto(`${BASE}/library?tag=bulk`, { waitUntil: "networkidle" });
      check("student: the bottom bar still shows Library as current", (await p.getAttribute('nav[aria-label="Main"] a[href="/library"]', "aria-current")) === "page");
      await axeRun(p, "list, signed in");
    }
  }
  await b.close();
  done();
})();
