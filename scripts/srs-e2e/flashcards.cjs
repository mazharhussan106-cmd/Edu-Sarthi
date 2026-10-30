// Owns the browser checks for spaced repetition v2 on the Flashcards tab
// (docs/SRS-V2-PLAN.md): Unknown → 3 days and a practice look three cards
// later that saves nothing, a new card's Known → 7 days, the seven-step
// Review Plan box, Settings → Reviews per day, and the "Done for today" card
// when the review limit holds cards back.
//
// It deliberately does NOT seed (run.cjs does) and uses only the SRS- test rows.

const { chromium, BASE, sql, check, cardState, login, answer, cardWord, isPractice, toSide3, done } = require("./lib.cjs");

(async () => {
  const browser = await chromium.launch();
  const p = await login(browser);

  await p.goto(`${BASE}/flashcards?kind=words`);
  await p.waitForLoadState("networkidle");
  check("first card is abandon", (await cardWord(p)) === "abandon", await cardWord(p));
  await answer(p, "Unknown");
  check("URL carries again=SRS-W-001~3", p.url().includes("again=SRS-W-001~3"), p.url());
  check("Unknown saved once, due in 3 India days", cardState("SRS-W-001") === "1:0:3", cardState("SRS-W-001"));
  for (const w of ["brief", "candid", "diligent"]) {
    check(`${w}: normal card, no practice line`, (await cardWord(p)) === w && !(await isPractice(p)), await cardWord(p));
    await answer(p, "Known");
  }
  check("abandon comes back as practice after 3 cards", (await cardWord(p)) === "abandon" && (await isPractice(p)), await cardWord(p));
  await answer(p, "Known");
  check("practice answer not saved", cardState("SRS-W-001") === "1:0:3", cardState("SRS-W-001"));
  check("then eager, again list gone", (await cardWord(p)) === "eager" && !p.url().includes("again="), `${await cardWord(p)} ${p.url()}`);
  check("a new card's Known → 7 days", cardState("SRS-W-002") === "1:1:7", cardState("SRS-W-002"));
  check("first answer time is set once", sql(`SELECT ("firstReviewedAt" IS NOT NULL)::text FROM "CardState" cs JOIN "Word" w ON w.id = cs."wordId" WHERE w.code = 'SRS-W-001'`) === "true");

  await toSide3(p);
  const side3 = await p.locator("main").textContent();
  check("side 3: Day 3 … Day 180, no Day 1", side3.includes("Spaced Repetition · Your Review Plan") && side3.includes("Day 180") && !/Day 1(?!\d)/.test(side3), (side3.match(/Spaced Repetition[^]*?plan\./) || [""])[0]);

  // ‹ back to diligent and answer it again: still one new card today, not a
  // review. After 8 s, or the API's double-tap guard ignores the answer.
  await p.waitForTimeout(8500);
  await p.goto(`${BASE}/flashcards?kind=words&card=SRS-W-004`);
  await p.waitForLoadState("networkidle");
  await answer(p, "Known");
  // Four new cards answered today (abandon … diligent), diligent twice: 10 − 4 = 6 new left, not 7.
  const bar = ((await p.locator("main").textContent()).match(/due · (\d+) new/) || [])[1];
  check("re-answering a new card the same day keeps it new (6 new left)", bar === "6" && cardState("SRS-W-004").startsWith("2:"), `${bar} new left, ${cardState("SRS-W-004")}`);

  await p.goto(`${BASE}/settings`);
  await p.getByText("Reviews per day", { exact: true }).first().click();
  await p.getByText("50 reviews", { exact: true }).click();
  await p.waitForTimeout(1500);
  check("Settings → Reviews per day → 50 saved", sql(`SELECT preferences->>'reviewsPerDay' FROM "User" WHERE email = 'srs-student@test.local'`) === "50");

  // Review limit used: 50 reviewed today, 10 due, new cards used up.
  const uid = sql(`SELECT id FROM "User" WHERE email = 'srs-student@test.local'`);
  sql(`DELETE FROM "CardState" WHERE "userId" = '${uid}'`);
  sql(`INSERT INTO "CardState"(id, "userId", "wordId", stage, reviews, "createdAt", "firstReviewedAt", "lastReviewedAt", "dueAt")
       SELECT 'srs-rv-' || w.code, '${uid}', w.id, 1, 2, now() - interval '10 days', now() - interval '10 days', now() - interval '5 minutes', now() + interval '7 days'
       FROM "Word" w WHERE w.code BETWEEN 'SRS-X-001' AND 'SRS-X-050'`);
  sql(`INSERT INTO "CardState"(id, "userId", "wordId", stage, reviews, "createdAt", "firstReviewedAt", "lastReviewedAt", "dueAt")
       SELECT 'srs-du-' || w.code, '${uid}', w.id, 1, 2, now() - interval '10 days', now() - interval '10 days', now() - interval '9 days', now() - interval '1 day'
       FROM "Word" w WHERE w.code BETWEEN 'SRS-X-051' AND 'SRS-X-060'`);
  sql(`INSERT INTO "CardState"(id, "userId", "wordId", stage, reviews, "createdAt", "firstReviewedAt", "lastReviewedAt", "dueAt")
       SELECT 'srs-nw-' || w.code, '${uid}', w.id, 0, 1, now() - interval '1 minute', now() - interval '1 minute', now() - interval '1 minute', now() + interval '3 days'
       FROM "Word" w WHERE w.code LIKE 'SRS-W-%'`);
  sql(`UPDATE "User" SET preferences = coalesce(preferences, '{}'::jsonb) || '{"newPerDay": 5, "reviewsPerDay": 50}' WHERE id = '${uid}'`);
  await p.goto(`${BASE}/flashcards?kind=words`);
  await p.waitForLoadState("networkidle");
  const body = await p.locator("main").textContent();
  check("Done card: 10 more wait for tomorrow", body.includes("Done for today") && body.includes("10 more cards are due; they will wait for tomorrow"), body.slice(0, 200));
  await p.getByRole("link", { name: "Keep going anyway" }).click();
  await p.waitForLoadState("networkidle");
  check("Keep going serves a due card", /^extra(5[1-9]|60)$/.test((await cardWord(p)) || ""), await cardWord(p));

  check("no page errors", p.errors.length === 0, p.errors.join(" | "));
  await browser.close();
  done();
})();
