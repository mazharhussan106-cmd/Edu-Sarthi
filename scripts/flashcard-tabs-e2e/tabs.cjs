// Owns the browser and API checks for the student's own study tabs (＋ at the
// end of layer 1, docs/FLASHCARD-NAV-LAYERS.md decisions 9–12): make, fill,
// remove, arrange, hide, rename and delete tabs; the question after a copy;
// the limit under parallel requests; other students, teachers and guests;
// the fallback when the tables are missing; the data download; axe.
//
// It deliberately does NOT re-test the filter rows (filters.cjs does). Local
// only: it deletes the test student's tabs, decks and follows (README.md),
// and briefly renames the StudyTab table to test the fallback.

const { chromium, BASE, check, login, axe, done } = require("../profile-e2e/lib.cjs");
const { sql } = require("../library-e2e/lib.cjs");
const api = (p, url, body) =>
  p.evaluate(
    async ([u, b]) => {
      const r = await fetch(u, b ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) } : undefined);
      return { status: r.status, body: JSON.parse(await r.text()) };
    },
    [url, body],
  );

(async () => {
  // A clean start for the test student: no tabs, no copies, no follows.
  sql(`delete from "StudyTab" where "userId" in (select id from "User" where email in ('new@test.local','other@test.local'))`);
  sql(`delete from "Deck" where "ownerId" = (select id from "User" where email='new@test.local')`);
  sql(`delete from "DeckFollow" where "userId" = (select id from "User" where email='new@test.local')`);
  const libDaily = sql(`select id from "Deck" where title='Daily chunks'`);
  const libInterview = sql(`select id from "Deck" where title='Interview answers'`);
  const waiting = sql(`select id from "Deck" where title='Waiting deck'`);

  const browser = await chromium.launch();
  const p = await login(browser, "new", 390);
  await p.goto(`${BASE}/flashcards`, { waitUntil: "networkidle" });
  const area = () => p.getByRole("navigation", { name: "Study area" });
  const labels = async () => (await area().getByRole("link").allInnerTexts()).map((s) => s.trim());

  check("default tabs before anything is saved", JSON.stringify(await labels()) === JSON.stringify(["English", "Tech", "My decks"]), JSON.stringify(await labels()));
  check("＋ button is there", (await p.getByRole("button", { name: "Make or arrange your tabs" }).count()) === 1);

  // Decks to put in tabs: two of their own and one followed library deck.
  const sqlDeck = (await api(p, "/api/decks", { action: "create", title: "SQL basics", tags: [] })).body.id;
  const pyDeck = (await api(p, "/api/decks", { action: "create", title: "Python basics", tags: [] })).body.id;
  check("follow a library deck", (await api(p, "/api/decks", { action: "follow", deckId: libDaily })).status === 200);

  // Make a tab from the sheet; it opens the new tab.
  await p.getByRole("button", { name: "Make or arrange your tabs" }).click();
  await p.getByLabel("New tab").fill("Projects");
  await p.getByRole("button", { name: "Make tab" }).click();
  await p.waitForURL((u) => u.pathname.startsWith("/tabs/"));
  await p.waitForLoadState("networkidle");
  const techId = new URL(p.url()).pathname.split("/").pop();
  check("new tab opens with its name", (await p.locator("h1").innerText()) === "Projects");
  check("new tab is current in layer 1", (await area().getByRole("link", { name: "Projects" }).getAttribute("aria-current")) === "page");
  check("empty tab says how to fill it", /No decks in this tab yet/.test(await p.locator("main").innerText()));

  // Add decks.
  await p.getByRole("button", { name: "＋ Add decks" }).click();
  const sheet = p.getByRole("dialog", { name: "Decks in Projects" });
  check("picker lists own and followed decks", (await sheet.getByRole("checkbox").count()) === 3);
  await sheet.getByLabel("SQL basics").check();
  await sheet.getByLabel("Daily chunks").check();
  await sheet.getByRole("button", { name: /Save · 2 decks/ }).click();
  await p.waitForLoadState("networkidle");
  await p.waitForTimeout(800);
  const rows = await p.getByRole("list", { name: "Decks in Projects" }).getByRole("listitem").allInnerTexts();
  check("tab shows the two decks", rows.length === 2 && rows.some((r) => /SQL basics/.test(r)) && rows.some((r) => /Daily chunks/.test(r)), JSON.stringify(rows));
  check("own deck studies on /decks", (await p.getByRole("link", { name: "Study SQL basics" }).getAttribute("href")) === `/decks/${sqlDeck}/study`);
  check("followed deck studies on the library", (await p.getByRole("link", { name: "Study Daily chunks" }).getAttribute("href")) === `/library/${libDaily}/study`);
  await p.getByRole("link", { name: "Study SQL basics" }).click();
  await p.waitForURL((u) => u.pathname === `/decks/${sqlDeck}/study`);
  check("Study opens the deck's study page", true);
  await p.goBack();
  await p.waitForLoadState("networkidle");

  // Remove one.
  await p.getByRole("button", { name: "Remove SQL basics from this tab" }).click();
  await p.waitForTimeout(1500);
  check("Remove takes it out of the tab", (await p.getByRole("list", { name: "Decks in Projects" }).getByRole("listitem").count()) === 1);
  check("…but the deck still exists", sql(`select count(*) from "Deck" where id='${sqlDeck}'`) === "1");

  // Arrange: Projects first, My decks hidden.
  await p.getByRole("button", { name: "Make or arrange your tabs" }).click();
  const ar = p.getByRole("dialog", { name: "Your tabs" });
  for (let i = 0; i < 3; i++) await ar.getByRole("button", { name: "Move Projects up" }).click();
  await ar.getByLabel("Show My decks").uncheck();
  await ar.getByRole("button", { name: "Save order" }).click();
  await p.waitForTimeout(1500);
  check("order saved: Projects, English, Tech (My decks hidden)", JSON.stringify(await labels()) === JSON.stringify(["Projects", "English", "Tech"]), JSON.stringify(await labels()));
  await p.goto(`${BASE}/decks`, { waitUntil: "networkidle" });
  check("a hidden tab still shows while on its page", JSON.stringify(await labels()) === JSON.stringify(["Projects", "English", "Tech", "My decks"]), JSON.stringify(await labels()));

  // Hiding every tab is refused, on screen and on the server.
  await p.getByRole("button", { name: "Make or arrange your tabs" }).click();
  await ar.getByLabel("Show Projects").uncheck();
  await ar.getByLabel("Show Tech").uncheck();
  await ar.getByLabel("Show English").click();
  check("the last shown tab stays ticked", await ar.getByLabel("Show English").isChecked());
  check("cannot hide the last tab (screen)", /Keep at least one tab showing/.test(await ar.innerText()));
  await ar.getByRole("button", { name: "Close" }).click();
  const allHidden = await api(p, "/api/study-tabs", { action: "arrange", tabs: [{ key: "english", hidden: true }, { key: "tech", hidden: true }, { key: "decks", hidden: true }, { key: techId, hidden: true }] });
  check("cannot hide the last tab (server)", allHidden.status === 400);
  const stale = await api(p, "/api/study-tabs", { action: "arrange", tabs: [{ key: "english", hidden: false }] });
  check("an out-of-date order is refused", stale.status === 400 && /changed on another device/.test(stale.body.error));

  // Rename.
  await p.getByRole("button", { name: "Make or arrange your tabs" }).click();
  await ar.getByRole("button", { name: "Rename Projects" }).click();
  await ar.getByLabel("New name for Projects").fill("Project work");
  await ar.getByRole("button", { name: "Save", exact: true }).click();
  await p.waitForTimeout(1500);
  check("rename shows in layer 1", (await labels()).includes("Project work"));
  await ar.getByRole("button", { name: "Close" }).click();

  // Copy from the library asks which tabs.
  await p.goto(`${BASE}/library/${libInterview}`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Make my own copy" }).click();
  const place = p.getByRole("dialog", { name: "Show this deck in which tabs?" });
  await place.waitFor({ timeout: 20000 });
  check("copy asks which tabs", true);
  await place.getByLabel("Project work").check();
  await place.getByLabel("Or a new tab").fill("Interview");
  await place.getByRole("button", { name: "Save" }).click();
  await p.waitForURL((u) => /^\/decks\/[a-z0-9]+$/.test(u.pathname), { timeout: 20000 });
  const copyId = new URL(p.url()).pathname.split("/").pop();
  check("after Save the copy opens as before", true);
  const placedIn = sql(`select string_agg(t.name, ',' order by t.name) from "StudyTabDeck" x join "StudyTab" t on t.id=x."tabId" where x."deckId"='${copyId}'`);
  check("copy placed in Project work and the new Interview tab", placedIn === "Interview,Project work", placedIn);

  // Skip: copy lands in no tab.
  await p.goto(`${BASE}/library/${libDaily}`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Make my own copy" }).click();
  await place.waitFor({ timeout: 20000 });
  await place.getByRole("button", { name: "Skip" }).click();
  await p.waitForURL((u) => /^\/decks\/[a-z0-9]+$/.test(u.pathname), { timeout: 20000 });
  const skipId = new URL(p.url()).pathname.split("/").pop();
  check("Skip opens the copy and puts it in no tab", sql(`select count(*) from "StudyTabDeck" where "deckId"='${skipId}'`) === "0");

  // Delete a tab while on it: lands on the Flashcard tab; decks stay.
  const interviewId = sql(`select id from "StudyTab" where name='Interview'`);
  await p.goto(`${BASE}/tabs/${interviewId}`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Make or arrange your tabs" }).click();
  await ar.getByRole("button", { name: "Delete Interview" }).click();
  await ar.getByRole("button", { name: "Delete", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/flashcards", { timeout: 20000 });
  check("deleting the open tab lands on the Flashcard tab", true);
  check("…and its deck is still there", sql(`select count(*) from "Deck" where id='${copyId}'`) === "1");

  // Deleting a deck takes it out of every tab.
  await api(p, "/api/decks", { action: "delete", id: copyId });
  check("a deleted deck leaves every tab", sql(`select count(*) from "StudyTabDeck" where "deckId"='${copyId}'`) === "0");

  // Server refuses decks the student cannot open, and other people's tabs.
  const bad = await api(p, "/api/study-tabs", { action: "setDecks", id: techId, deckIds: [waiting] });
  check("cannot add a deck you cannot open", bad.status === 400);
  const o = await login(browser, "other", 390);
  await o.goto(`${BASE}/tabs/${techId}`, { waitUntil: "networkidle" });
  // HTTP 200 with the not-found page: (student)/loading.tsx streams first (as
  // the library notes in PROJECT-MEMORY). What matters is that nothing leaks.
  const peekHtml = await o.content();
  check("another student's tab shows not-found and leaks nothing", /could not find that page/.test(peekHtml) && !peekHtml.includes("Project work") && !peekHtml.includes("Daily chunks"));
  const steal = await api(o, "/api/study-tabs", { action: "rename", id: techId, name: "Mine now" });
  check("another student cannot rename it", steal.status === 400 && sql(`select name from "StudyTab" where id='${techId}'`) === "Project work");
  const steal2 = await api(o, "/api/study-tabs", { action: "removeDeck", id: techId, deckId: libDaily });
  check("another student cannot empty it", steal2.status === 200 && sql(`select count(*) from "StudyTabDeck" where "tabId"='${techId}'`) === "1");
  await o.context().close();

  // The limit holds under 25 parallel creates.
  const burst = await p.evaluate(async () => {
    const rs = await Promise.all(Array.from({ length: 25 }, (_, i) => fetch("/api/study-tabs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name: `Burst ${i}` }) })));
    return rs.map((r) => r.status);
  });
  const own = Number(sql(`select count(*) from "StudyTab" where kind='OWN' and "userId"=(select id from "User" where email='new@test.local')`));
  check("never more than 20 own tabs, even in parallel", own === 20, `${own} tabs; statuses ${burst.join(",")}`);
  sql(`delete from "StudyTab" where kind='OWN' and name like 'Burst %'`);

  // Data download includes the tabs.
  const me = await p.evaluate(async () => JSON.parse(await (await fetch("/api/me")).text()));
  check("data download includes the tabs", Array.isArray(me.account?.studyTabs) && me.account.studyTabs.some((t) => t.name === "Project work"));

  // Teacher: the copy does not ask; no tabs on My decks.
  const t = await login(browser, "teacher", 390);
  await t.goto(`${BASE}/library/${libInterview}`, { waitUntil: "networkidle" });
  const tCopy = t.getByRole("button", { name: /copy/i }).first();
  if (await tCopy.count()) {
    await tCopy.click();
    await t.waitForURL((u) => /^\/decks\/[a-z0-9]+$/.test(u.pathname), { timeout: 20000 });
    check("teacher's copy opens with no tabs question", (await t.getByRole("dialog", { name: "Show this deck in which tabs?" }).count()) === 0);
  }
  check("teacher API answers not enabled", (await api(t, "/api/study-tabs")).body.enabled === false);
  await t.context().close();

  // Guest: the built-in tabs, no ＋.
  const g = await login(browser, "guest", 390);
  await g.goto(`${BASE}/flashcards`, { waitUntil: "networkidle" });
  check("guest: no ＋", (await g.getByRole("button", { name: "Make or arrange your tabs" }).count()) === 0);
  check("guest API refused", (await api(g, "/api/study-tabs", { action: "create", name: "x" })).status === 403);
  await g.context().close();

  // If the tables are missing (Database setup not run yet), the bar falls back.
  sql(`alter table "StudyTab" rename to "StudyTab_off"`);
  try {
    const r = await p.goto(`${BASE}/flashcards`, { waitUntil: "networkidle" });
    check("no tables: Flashcard tab still loads", r.status() === 200 && JSON.stringify(await labels()) === JSON.stringify(["English", "Tech", "My decks"]), JSON.stringify(await labels()));
  } finally {
    sql(`alter table "StudyTab_off" rename to "StudyTab"`);
  }

  // Phone width: the bar fits, no sideways page scroll.
  for (const w of [360, 390]) {
    await p.setViewportSize({ width: w, height: 800 });
    await p.goto(`${BASE}/flashcards`, { waitUntil: "networkidle" });
    check(`${w}: no sideways page scroll`, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  }
  await p.setViewportSize({ width: 390, height: 844 });

  // Keyboard: ＋ opens with Enter, Escape closes.
  await p.getByRole("button", { name: "Make or arrange your tabs" }).focus();
  await p.keyboard.press("Enter");
  check("Enter opens the sheet", await ar.isVisible());
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  check("Escape closes it", !(await ar.isVisible()));

  // Accessibility in every theme: the tab page, and each sheet open.
  await p.goto(`${BASE}/tabs/${techId}`, { waitUntil: "networkidle" });
  await axe(p, "tab page");
  await axe(p, "Your tabs sheet", undefined, async (pp) => pp.getByRole("button", { name: "Make or arrange your tabs" }).click());
  await axe(p, "Add decks sheet", undefined, async (pp) => pp.getByRole("button", { name: "＋ Add decks" }).click());

  check("no page errors", p.errors.length === 0, p.errors.join(" | "));
  await browser.close();
  done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
