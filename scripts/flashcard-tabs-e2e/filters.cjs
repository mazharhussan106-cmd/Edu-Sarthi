// Owns the browser checks for the Flashcard tab's filters in two layers
// (docs/FLASHCARD-NAV-LAYERS.md): study tabs with today's count, card kinds
// with skipped and the remark lists, no third row, the kind's chip naming a
// filter opened from elsewhere, Study this list, guest and teacher, the focus
// ring, and axe in every theme. At 360 and 390px wide.
//
// It deliberately does NOT test the student's own tabs (tabs.cjs does). Local
// only: it resets the test student's tabs and stars one card (README.md).

const { chromium, BASE, check, login, axe, done } = require("../profile-e2e/lib.cjs");
const { sql } = require("../library-e2e/lib.cjs");

(async () => {
  // The default tabs, and one starred card for the "Study this list" check.
  const me = `(select id from "User" where email = 'new@test.local')`;
  sql(`delete from "StudyTab" where "userId" = ${me}`);
  sql(`insert into "CardState" (id, "userId", "wordId", important, "dueAt") select 'e2etabsstar0001', ${me}, w.id, true, now() from "Word" w where w.code = 'CORE-002' and w."deckId" is null on conflict (id) do update set important = true`);
  const browser = await chromium.launch();

  // ---- Student at phone width -------------------------------------------
  for (const width of [360, 390]) {
    const p = await login(browser, "new", width);
    await p.goto(`${BASE}/flashcards`, { waitUntil: "networkidle" });

    const area = p.getByRole("navigation", { name: "Study area" });
    check(`${width}: study area tabs shown`, (await area.getByRole("link").count()) === 3);
    check(`${width}: English is current`, (await area.getByRole("link", { name: "English" }).getAttribute("aria-current")) === "page");
    check(`${width}: count beside the tabs`, (width < 640 ? /due · \d+ new/ : /due · \d+ new · \d+\/\d+ known/).test((await p.locator("main > div").first().innerText()).replace(/\s+/g, " ")));
    check(`${width}: no Explore/Library/Institute chips in the bar`, (await p.locator("main").getByRole("link", { name: /Explore|Library|Institute/ }).count()) === 0);
    const noHScroll = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    check(`${width}: page does not scroll sideways`, noHScroll);

    // Layer 2: every kind link lands on its tab and marks itself current.
    for (const [label, value] of [["Words", "words"], ["Chunk", "chunks"], ["Grammar", "grammar"], ["Support", "support"]]) {
      await p.getByRole("navigation", { name: "Card kind" }).getByRole("link", { name: label, exact: true }).click();
      await p.waitForURL((u) => u.searchParams.get("kind") === value);
      await p.waitForLoadState("networkidle");
      const cur = await p.getByRole("navigation", { name: "Card kind" }).getByRole("link", { name: label, exact: true }).getAttribute("aria-current");
      check(`${width}: ${label} tab opens and is current`, cur === "page");
      const lists = await p.getByRole("navigation", { name: "My lists" }).getByRole("link").count();
      check(`${width}: ${label} shows the 4 remark lists`, lists === 4);
      const visible = await p.getByRole("navigation", { name: "Card kind" }).getByRole("link", { name: "Support", exact: true }).boundingBox();
      check(`${width}: ${label} — all four kinds fit on screen`, !!visible && visible.x + visible.width <= width);
    }

    // Layer 3 is gone: no chunk type, Support channel/level or sections chips.
    for (const [path, name] of [["/flashcards?kind=chunks", "Chunk type"], ["/flashcards?kind=support", "Support channel"], ["/flashcards?kind=support", "Support level"]]) {
      await p.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      check(`${width}: no "${name}" row`, (await p.getByRole("navigation", { name }).count()) === 0);
    }
    await p.goto(`${BASE}/flashcards?kind=words`, { waitUntil: "networkidle" });
    check(`${width}: no 📂 Sections chip`, (await p.getByRole("link", { name: /Sections/ }).count()) === 0);
    // Rows on screen: the screen-reader-only heading is not one.
    const rows = await p.evaluate(() => [...document.querySelector("main").children].filter((e) => e.tagName !== "H1" && !e.querySelector("[aria-roledescription=flashcard]") && !/Done for today/.test(e.textContent)).length);
    check(`${width}: two rows above the card`, rows === 2, String(rows));

    // A filtered link from elsewhere (Explore) names its filter on the chip,
    // and tapping the chip shows the whole kind again.
    await p.goto(`${BASE}/flashcards?kind=chunks&type=frames`, { waitUntil: "networkidle" });
    const named = p.getByRole("navigation", { name: "Card kind" }).getByRole("link", { name: /^Chunk · Frames/ });
    check(`${width}: chip reads "Chunk · Frames"`, (await named.count()) === 1 && /Chunk · Frames/.test(await named.innerText()));
    check(`${width}: Frames link still serves a frame`, /Chunk Type\s*Frames/.test(await p.locator("[aria-roledescription=flashcard]").innerText()));
    await named.click();
    await p.waitForURL((u) => u.searchParams.get("kind") === "chunks" && !u.searchParams.get("type"));
    await p.waitForLoadState("networkidle");
    check(`${width}: tapping it clears the type`, (await p.getByRole("navigation", { name: "Card kind" }).getByRole("link", { name: "Chunk", exact: true }).count()) === 1);

    await p.goto(`${BASE}/flashcards?kind=support&ch=chat&lv=basic`, { waitUntil: "networkidle" });
    const sup = await p.getByRole("navigation", { name: "Card kind" }).getByRole("link", { name: /^Support/ }).innerText();
    check(`${width}: chip reads "Support · Chat · Basic"`, /Support · Chat · Basic/.test(sup), sup);

    await p.goto(`${BASE}/flashcards?kind=words&sec=level-a1`, { waitUntil: "networkidle" });
    const wd = await p.getByRole("navigation", { name: "Card kind" }).getByRole("link", { name: /^Words/ }).innerText();
    check(`${width}: chip names the word section`, /Words · A1/.test(wd), wd);

    // Skip with › and see the skipped chip, then show them again.
    await p.goto(`${BASE}/flashcards?kind=grammar`, { waitUntil: "networkidle" });
    const before = await p.locator("[aria-roledescription=flashcard]").getAttribute("aria-label");
    await p.getByRole("button", { name: /next card/i }).click();
    await p.waitForURL((u) => !!u.searchParams.get("skip"));
    await p.waitForLoadState("networkidle");
    const chip = p.getByRole("link", { name: /1 skipped · show again/ });
    check(`${width}: skipped chip appears after ›`, (await chip.count()) === 1);
    const after = await p.locator("[aria-roledescription=flashcard]").getAttribute("aria-label");
    check(`${width}: › moved to another card`, before !== after);
    await chip.click();
    await p.waitForURL((u) => !u.searchParams.get("skip"));
    check(`${width}: show again clears the skip`, true);

    // Remark list opens its list and toggles back.
    await p.goto(`${BASE}/flashcards?kind=chunks`, { waitUntil: "networkidle" });
    await p.getByRole("navigation", { name: "My lists" }).getByRole("link", { name: /Important list/ }).click();
    await p.waitForURL((u) => u.searchParams.get("list") === "important");
    await p.waitForLoadState("networkidle");
    const imp = p.getByRole("navigation", { name: "My lists" }).getByRole("link", { name: /Important list/ });
    check(`${width}: Important list current`, (await imp.getAttribute("aria-current")) === "page");
    await imp.click();
    await p.waitForURL((u) => !u.searchParams.get("list"));
    check(`${width}: tapping the open list goes back to the cards`, true);

    // Layer 1: My decks keeps the tabs in place; English comes back.
    await p.getByRole("navigation", { name: "Study area" }).getByRole("link", { name: "My decks" }).click();
    await p.waitForURL((u) => u.pathname === "/decks");
    await p.waitForLoadState("networkidle");
    check(`${width}: My decks current on /decks`, (await p.getByRole("navigation", { name: "Study area" }).getByRole("link", { name: "My decks" }).getAttribute("aria-current")) === "page");
    check(`${width}: old "← Word cards" link gone`, (await p.getByRole("link", { name: "← Word cards" }).count()) === 0);
    await p.getByRole("navigation", { name: "Study area" }).getByRole("link", { name: "English" }).click();
    await p.waitForURL((u) => u.pathname === "/flashcards");
    check(`${width}: English goes back to the Flashcard tab`, true);

    // Keyboard: the focus ring of the first kind chip is not clipped.
    await p.goto(`${BASE}/flashcards?kind=chunks`, { waitUntil: "networkidle" });
    await p.getByRole("navigation", { name: "Card kind" }).getByRole("link", { name: "Words", exact: true }).focus();
    await p.keyboard.press("Shift+Tab");
    await p.keyboard.press("Tab");
    const ring = await p.evaluate(() => {
      const a = document.activeElement;
      const row = a.closest("nav").parentElement;
      const r = a.getBoundingClientRect();
      const c = row.getBoundingClientRect();
      return { text: a.textContent, topRoom: r.top - c.top, bottomRoom: c.bottom - r.bottom, leftRoom: r.left - c.left, outline: getComputedStyle(a).outlineStyle };
    });
    check(`${width}: focused chip has 4px room for its ring`, ring.outline === "solid" && ring.topRoom >= 4 && ring.bottomRoom >= 4 && ring.leftRoom >= 4, JSON.stringify(ring));

    check(`${width}: no page errors`, p.errors.length === 0, p.errors.join(" | "));
    await p.context().close();
  }

  // ---- Study this list replaces the whole bar ----------------------------
  {
    const p = await login(browser, "new", 390);
    await p.goto(`${BASE}/my-cards/study?list=important`, { waitUntil: "networkidle" });
    const inSession = /Studying/.test(await p.locator("main").innerText());
    check("Study this list: session strip shown", inSession);
    check("Study this list: no study-area tabs during the session", (await p.getByRole("navigation", { name: "Study area" }).count()) === 0);
    await p.context().close();
  }

  // ---- Guest and teacher -------------------------------------------------
  {
    const g = await login(browser, "guest", 390);
    await g.goto(`${BASE}/flashcards?kind=chunks`, { waitUntil: "networkidle" });
    check("guest: bar and card shown", (await g.getByRole("navigation", { name: "Study area" }).count()) === 1 && (await g.locator("[aria-roledescription=flashcard]").count()) === 1);
    await g.context().close();
    const t = await login(browser, "teacher", 390);
    await t.goto(`${BASE}/decks`, { waitUntil: "networkidle" });
    check("teacher: no study-area tabs on My decks", (await t.getByRole("navigation", { name: "Study area" }).count()) === 0);
    check("teacher: My decks still loads", /My decks/.test(await t.locator("h1").first().innerText()));
    await t.context().close();
  }

  // ---- Accessibility, every theme ----------------------------------------
  {
    const p = await login(browser, "new", 390);
    for (const path of ["/flashcards?kind=chunks", "/flashcards?kind=chunks&type=frames", "/flashcards?kind=support&ch=chat", "/flashcards?kind=words&sec=level-a1", "/decks"]) {
      await p.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await axe(p, path);
    }
    await p.context().close();
  }

  await browser.close();
  done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
