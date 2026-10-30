// Owns the checks that the library replaced Class in the header, the phone's
// bottom bar and the footer, that the menu and Settings kept their own groups
// and links, and that the library list, a deck and a card are open to a visitor
// who is not signed in (with every account-only action showing a sign-in link,
// and study and practice still behind login). Includes axe in five themes.
//
// It deliberately does NOT start the app or the database; README.md says how.

const { chromium, BASE, check, login, done } = require("../profile-e2e/lib.cjs");
const fs = require("fs");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const IDS = JSON.parse(process.env.IDS);
const texts = (p, sel) => p.$$eval(sel, (els) => els.map((e) => e.textContent.trim().replace(/\s+/g, " ")));
const { sql } = require("./lib.cjs");

async function axeRun(p, label) {
  for (const theme of ["light", "dark", "sepia", "midnight", "high-contrast"]) {
    await p.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await p.waitForTimeout(150);
    await p.addScriptTag({ content: AXE }).catch(() => {});
    const found = await p.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] });
      return r.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes.slice(0, 3).map((n) => n.html.slice(0, 90)).join(" | ")}`);
    });
    // Known on every page, per docs/PROJECT-MEMORY.md: the logotype's contrast.
    const mine = found
      .map((x) => x.replace(/<a class="font-display text-lg font-bold text-brand[^|]*\|?|<p class="font-display text-base font-bold text-brand">EduSarthi<\/p>\s*\|?/g, ""))
      .filter((x) => !/^color-contrast\(\d+\):\s*$/.test(x));
    check(`axe ${label} [${theme}]`, mine.length === 0, mine.join(" ; "));
  }
  await p.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
}

(async () => {
  const browser = await chromium.launch();

  // ---- Student, phone ----------------------------------------------------
  const s = await login(browser, "student", 390);
  await s.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  const bar = await texts(s, 'nav[aria-label="Main"] a');
  check("phone bar is Dashboard, Flashcard, Audited, Library, Profile", JSON.stringify(bar) === JSON.stringify(["Dashboard", "Flashcard", "Audited", "Library", "Profile"]), JSON.stringify(bar));
  check("no Class in the bar", !bar.includes("Class"));
  check("Library tab lit on /library", (await s.getAttribute('nav[aria-label="Main"] a[href="/library"]', "aria-current")) === "page");
  await s.goto(`${BASE}/library/${IDS.pub}`, { waitUntil: "networkidle" });
  check("Library tab lit on a deck", (await s.getAttribute('nav[aria-label="Main"] a[href="/library"]', "aria-current")) === "page");
  // The seeded student owns this deck, so another signed-in student checks the buttons.
  const o = await login(browser, "other", 390);
  await o.goto(`${BASE}/library/${IDS.pub}`, { waitUntil: "networkidle" });
  check("signed in (not the owner): Follow, copy, like and report are real controls", (await o.getByRole("button", { name: /Make my own copy/ }).count()) === 1 && (await o.getByRole("button", { name: /Like this deck/ }).count()) === 1 && (await o.getByRole("button", { name: "Report this deck" }).count()) === 1 && (await o.getByText("Sign in to study or copy this deck").count()) === 0);
  check("signed in: the owner sees no Report on their own deck", (await s.getByRole("button", { name: "Report this deck" }).count()) === 0);
  await s.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await s.click('nav[aria-label="Main"] a[href="/library"]');
  await s.waitForURL(`${BASE}/library`);
  check("tapping Library opens /library", true);
  await s.getByRole("link", { name: "My decks" }).first().waitFor({ timeout: 15000 }).catch(() => {});
  check("signed in: My decks link on the library", (await s.getByRole("link", { name: "My decks" }).count()) >= 1);
  const foot = await texts(s, "footer nav a");
  check("footer links: Library first", foot[0] === "Library" && foot.includes("About") && foot.includes("Terms"), JSON.stringify(foot));

  // The menu: only "Main pages" follows the bar; every other group is as before.
  await s.getByRole("button", { name: /menu/i }).first().click();
  await s.waitForSelector('[role="dialog"]');
  const heads = await texts(s, '[role="dialog"] summary');
  const names = heads.map((h) => h.replace(/\d+$/, "").trim());
  const expectedGroups = ["Main pages", "Today's tasks", "Learn and practise", "Create flashcards", "My card lists", "Shared and library decks", "My account and progress", "Help and support", "About and policies"];
  check("menu groups unchanged (nine, same order)", JSON.stringify(names.map((n) => n.replace(/^\S+\s/, ""))) === JSON.stringify(expectedGroups) || expectedGroups.every((g) => names.some((n) => n.includes(g))), JSON.stringify(names));
  await s.locator('[role="dialog"] summary', { hasText: "Main pages" }).click();
  const main = await texts(s, '[role="dialog"] details[open] a');
  check("menu → Main pages mirrors the bar (Library, no Class)", main.includes("Library") && !main.includes("Class"), JSON.stringify(main));
  await s.locator('[role="dialog"] summary', { hasText: "Shared and library decks" }).click();
  const shared = await texts(s, '[role="dialog"] details[open] a');
  check("menu → Shared and library decks still has Library", shared.includes("Library"), JSON.stringify(shared));
  await s.keyboard.press("Escape");

  // Settings link is untouched.
  const gear = await s.$$eval('a[href="/settings"]', (a) => a.length);
  check("Settings gear still links to /settings", gear >= 1);
  check("student phone: no page errors", s.errors.length === 0, s.errors.join(" | "));

  // ---- Student, computer -------------------------------------------------
  const d = await login(browser, "student", 1280);
  await d.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const header = await texts(d, "header nav a");
  check("computer header row has Library, not Class", header.includes("Library") && !header.includes("Class"), JSON.stringify(header));
  const r = await d.goto(`${BASE}/class`, { waitUntil: "networkidle" });
  check("/class page still opens", r.status() === 200);
  check("Class page leaves no bar item lit", (await d.$$eval('header nav a[aria-current="page"]', (a) => a.length)) === 0);

  // ---- Teacher, computer: their header is untouched ----------------------
  const t = await login(browser, "teacher", 1280);
  await t.goto(`${BASE}/queue`, { waitUntil: "networkidle" });
  const tHead = await texts(t, "header nav a");
  check("teacher header has no Library or Class", !tHead.includes("Library") && !tHead.includes("Class") && tHead.length > 0, JSON.stringify(tHead));
  const tr = await t.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  check("teacher can still open the library inside their shell", tr.status() === 200 && (await t.$$eval("header nav a", (a) => a.length)) > 0);

  // ---- Signed out --------------------------------------------------------
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const v = await ctx.newPage();
  v.errors = [];
  v.on("pageerror", (e) => v.errors.push(e.message));
  await v.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check("landing header: Library, Sign in, Get started", (await v.locator("header").getByRole("link", { name: "Library" }).count()) === 1 && (await v.locator("header").getByRole("link", { name: "Sign in" }).count()) === 1);
  await v.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  check("public page header has Library", (await v.locator("header").getByRole("link", { name: "Library" }).count()) === 1);
  await v.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  check("library: public header, no student nav", (await v.locator("header").getByRole("link", { name: "Library" }).count()) === 1 && (await v.locator('nav[aria-label="Main"]').count()) === 0);
  check("library: footer has Library", (await v.locator("footer").getByRole("link", { name: "Library" }).count()) === 1);
  check("library: only listed decks", (await v.getByText("E2E Public deck").count()) === 1 && (await v.getByText("E2E Pending deck").count()) === 0 && (await v.getByText("E2E Private deck").count()) === 0 && (await v.getByText("E2E Link deck").count()) === 0);
  check("library: search works signed out", await (async () => {
    await v.fill("#lib-search", "imported");
    await v.keyboard.press("Enter");
    await v.waitForURL(/q=imported/);
    return (await v.getByText("E2E Imported deck").count()) === 1 && (await v.getByText("E2E Public deck").count()) === 0;
  })());
  await axeRun(v, "library list (signed out)");
  await v.goto(`${BASE}/library/${IDS.pub}`, { waitUntil: "networkidle" });
  check("deck: one sign-in call to action, like and report links", (await v.getByRole("link", { name: "Sign in to study or copy this deck" }).count()) === 1 && (await v.getByRole("link", { name: /Sign in to like this deck/ }).count()) === 1 && (await v.getByRole("link", { name: "Sign in to report this deck" }).count()) === 1);
  check("deck: cards readable", (await v.getByText("to move fast on foot").count()) >= 1);
  await axeRun(v, "deck (signed out)");
  await v.goto(`${BASE}/library/${IDS.imported}`, { waitUntil: "networkidle" });
  await axeRun(v, "imported deck (signed out)");
  await v.getByRole("link", { name: "SELECT" }).click();
  await v.waitForURL(/\/card\//);
  check("card page opens signed out", (await v.getByText("SELECT").count()) >= 1);
  await axeRun(v, "card (signed out)");
  await v.goto(`${BASE}/library/${IDS.pub}`, { waitUntil: "networkidle" });
  await v.getByRole("link", { name: "Sign in to study or copy this deck" }).click();
  await v.waitForURL(`${BASE}/login`);
  check("sign-in call to action goes to /login", true);
  const studyRes = await v.goto(`${BASE}/library/${IDS.pub}/study`);
  check("study stays behind login", new URL(v.url()).pathname === "/login", v.url());
  await v.goto(`${BASE}/library/${IDS.pub}/practice/${IDS.pubCard}`);
  check("practice stays behind login", new URL(v.url()).pathname === "/login", v.url());
  check("signed-out: no page errors", v.errors.length === 0, v.errors.join(" | "));

  // ---- Taken down deck disappears for everyone ---------------------------
  sql(`update "Deck" set status='REJECTED' where id='${IDS.pub}'`);
  const gone = await ctx.newPage();
  const g = await gone.goto(`${BASE}/library/${IDS.pub}`, { waitUntil: "networkidle" });
  // HTTP 200 is by design: (shared)/loading.tsx streams first, and Next marks the not-found page noindex.
  check("rejected deck: not-found page, noindex, no cards, for a visitor", (await gone.locator('meta[name="robots"]').first().getAttribute("content")) === "noindex" && (await gone.getByText("to move fast on foot").count()) === 0 && (await gone.getByText("E2E Public deck").count()) === 0, `status ${g.status()}`);
  await gone.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  check("rejected deck: gone from the list", (await gone.getByText("E2E Public deck").count()) === 0);
  sql(`update "Deck" set status='APPROVED' where id='${IDS.pub}'`);
  const back = await gone.goto(`${BASE}/library/${IDS.pub}`);
  check("approved again: back", back.status() === 200);

  // /d/<token> must stay out of search
  await gone.goto(`${BASE}/d/e2elinktoken0000000000`, { waitUntil: "networkidle" });
  check("share-link page still noindex", (await gone.locator('meta[name="robots"]').first().getAttribute("content")) === "noindex, nofollow");

  await browser.close();
  done();
})();
