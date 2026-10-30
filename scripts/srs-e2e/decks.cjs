// Owns the browser checks for spaced repetition v2 on deck study pages: the
// student's own deck and a followed library deck. Unknown → 3 days and a
// practice look three cards later that saves nothing; at the end of a session
// a waiting practice card comes at once; a practice Unknown does not queue it
// again; side 3 shows the plan. Deck ids come from IDS (run.cjs).
//
// It deliberately does NOT seed (run.cjs does) and uses only the SRS- test rows.

const { chromium, BASE, check, cardState, login, answer, cardWord, isPractice, toSide3, done } = require("./lib.cjs");

const { own, lib } = JSON.parse(process.env.IDS);

(async () => {
  const browser = await chromium.launch();
  const p = await login(browser);

  for (const [label, path, prefix, words] of [
    ["own deck", `/decks/${own}/study`, "SRS-OWN", ["apple", "banana", "cherry", "date", "elder", "fig"]],
    ["library deck", `/library/${lib}/study`, "SRS-LIB", ["lion", "mango", "night", "ocean", "pearl", "quiet"]],
  ]) {
    console.log(`\n== ${label}`);
    await p.goto(BASE + path);
    await p.waitForLoadState("networkidle");
    check("first card", (await cardWord(p)) === words[0], await cardWord(p));
    await answer(p, "Unknown");
    check(`URL carries again=${prefix}-1~3`, p.url().includes(`again=${prefix}-1~3`), p.url());
    check("Unknown saved once, due in 3 India days", cardState(`${prefix}-1`) === "1:0:3", cardState(`${prefix}-1`));
    for (const w of words.slice(1, 4)) {
      check(`${w}: normal card, no practice line`, (await cardWord(p)) === w && !(await isPractice(p)), await cardWord(p));
      await answer(p, "Known");
    }
    check(`${words[0]} comes back as practice`, (await cardWord(p)) === words[0] && (await isPractice(p)), await cardWord(p));
    await answer(p, "Known");
    check("practice answer not saved", cardState(`${prefix}-1`) === "1:0:3", cardState(`${prefix}-1`));
    check(`then ${words[4]}, again list gone`, (await cardWord(p)) === words[4] && !p.url().includes("again="), `${await cardWord(p)} ${p.url()}`);
    check("a new card's Known → 7 days", cardState(`${prefix}-2`) === "1:1:7", cardState(`${prefix}-2`));
    await answer(p, "Unknown");
    await answer(p, "Known");
    check(`nothing left: ${words[4]} comes at once as practice`, (await cardWord(p)) === words[4] && (await isPractice(p)), await cardWord(p));
    await answer(p, "Unknown");
    const body = await p.locator("main").textContent();
    check("a practice Unknown does not queue it again: Done for now", body.includes("Done for now"), body.slice(0, 120));
    check("practice Unknown not saved", cardState(`${prefix}-5`) === "1:0:3", cardState(`${prefix}-5`));
  }

  await p.goto(`${BASE}/decks/${own}/study?card=SRS-OWN-2`);
  await p.waitForLoadState("networkidle");
  await toSide3(p);
  const s3 = await p.locator("main").textContent();
  check("deck side 3: ✓ Day 3, Day 7 · next … Day 180", s3.includes("Day 180") && /✓ Day 3/.test(s3) && s3.includes("Day 7 · next") && s3.includes("Next review in 7 days"), (s3.match(/Spaced Repetition[^]*?days\./) || [""])[0]);

  check("no page errors", p.errors.length === 0, p.errors.join(" | "));
  await browser.close();
  done();
})();
