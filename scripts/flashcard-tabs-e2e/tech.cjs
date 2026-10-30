// Owns the browser checks for the Tech tab (/tech): which decks show (the
// student's own, shared, followed, and the library's), which never do (another
// student's private deck, a deck waiting for review, a non-tech deck, an
// English deck whose title only sounds technical), Study versus Open, the
// subject chips and their counts, an unknown subject, a hidden Tech tab, a
// guest, no sideways scroll, and axe in every theme.
//
// It deliberately does NOT test how a title or tag is read (subjects.ts does).
// Local only: it makes and deletes decks whose titles start with "TT ", and
// deletes the test student's decks, follows and tabs (README.md).

const { chromium, BASE, check, login, axe, done } = require("../profile-e2e/lib.cjs");
const { sql } = require("../library-e2e/lib.cjs");

const user = (email) => `(select id from "User" where email = '${email}')`;
const api = (p, url, body) =>
  p.evaluate(
    async ([u, b]) => {
      const r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
      return { status: r.status, body: JSON.parse(await r.text()) };
    },
    [url, body],
  );
function deck(id, owner, title, tags, visibility, status) {
  sql(`insert into "Deck" (id, "ownerId", title, tags, visibility, status, "updatedAt") values ('${id}', ${user(owner)}, '${title}', '{${tags.join(",")}}', '${visibility}', '${status}', now())`);
}

(async () => {
  sql(`delete from "Deck" where title like 'TT %'`);
  sql(`delete from "Deck" where "ownerId" = ${user("new@test.local")}`);
  sql(`delete from "DeckFollow" where "userId" = ${user("new@test.local")}`);
  sql(`delete from "StudyTab" where "userId" = ${user("new@test.local")}`);
  deck("ttpython00000000001", "teacher@test.local", "TT Python for beginners", ["programming"], "PUBLIC", "APPROVED");
  deck("ttexcel000000000001", "admin@test.local", "TT Microsoft Excel", ["data"], "PUBLIC", "APPROVED");
  deck("ttweekend0000000001", "teacher@test.local", "TT Weekend English", ["travel"], "PUBLIC", "APPROVED");
  deck("ttsecret00000000001", "other@test.local", "TT Secret SQL", ["sql"], "PRIVATE", "DRAFT");
  deck("ttpending0000000001", "other@test.local", "TT Pending Docker", ["docker"], "PUBLIC", "PENDING_REVIEW");
  deck("ttshared00000000001", "other@test.local", "TT Shared Kubernetes", ["kubernetes"], "PRIVATE", "DRAFT");
  sql(`insert into "DeckMember" (id, "deckId", email, "userId", role, "acceptedAt") values ('ttmember0000000001', 'ttshared00000000001', 'new@test.local', ${user("new@test.local")}, 'VIEW', now())`);

  const browser = await chromium.launch();
  const p = await login(browser, "new", 390);
  const own = async (title, tags) => (await api(p, "/api/decks", { action: "create", title, tags })).body.id;
  const sqlDeck = await own("SQL basics", []);
  await own("Excel at interviews", []);
  await own("LLM notes", ["ai"]);
  await own("Networking at business events", []);
  check("follow a tech library deck", (await api(p, "/api/decks", { action: "follow", deckId: "ttpython00000000001" })).status === 200);

  await p.goto(`${BASE}/tech`, { waitUntil: "networkidle" });
  const area = p.getByRole("navigation", { name: "Study area" });
  check("Tech is current in layer 1", (await area.getByRole("link", { name: "Tech", exact: true }).getAttribute("aria-current")) === "page");
  const mine = p.getByRole("region", { name: "Your tech decks" });
  const more = p.getByRole("region", { name: "More in the library" });
  const text = await p.locator("main").innerText();
  for (const t of ["SQL basics", "LLM notes", "TT Python for beginners", "TT Shared Kubernetes"]) check(`yours: ${t}`, /./.test(t) && (await mine.getByText(t, { exact: true }).count()) === 1);
  check("library: TT Microsoft Excel", (await more.getByText("TT Microsoft Excel", { exact: true }).count()) === 1);
  for (const t of ["TT Secret SQL", "TT Pending Docker", "TT Weekend English", "Excel at interviews", "Networking at business events"]) check(`never shown: ${t}`, !text.includes(t));

  check("own deck: Study on /decks, from Tech", (await p.getByRole("link", { name: "Study SQL basics" }).getAttribute("href")) === `/decks/${sqlDeck}/study?from=tech`);
  check("shared deck: Study on /decks, from Tech", (await p.getByRole("link", { name: "Study TT Shared Kubernetes" }).getAttribute("href")) === "/decks/ttshared00000000001/study?from=tech");
  check("followed deck: Study on the library, from Tech", (await p.getByRole("link", { name: "Study TT Python for beginners" }).getAttribute("href")) === "/library/ttpython00000000001/study?from=tech");
  await p.getByRole("link", { name: "Study TT Python for beginners" }).click();
  await p.waitForURL((u) => u.pathname === "/library/ttpython00000000001/study");
  await p.waitForLoadState("networkidle");
  check("followed deck's study page keeps Tech current", (await area.getByRole("link", { name: "Tech", exact: true }).getAttribute("aria-current")) === "page");
  await p.goto(`${BASE}/tech`, { waitUntil: "networkidle" });
  check("library deck: Open its page", (await p.getByRole("link", { name: "Open TT Microsoft Excel" }).getAttribute("href")) === "/library/ttexcel000000000001");
  check("shared deck is labelled", /shared with you/.test(await mine.innerText()));

  // Subject chips: each count matches what the chip shows.
  const subjects = p.getByRole("navigation", { name: "Tech subject" });
  const chips = await subjects.getByRole("link").allInnerTexts();
  check("chips: All first, then subjects with decks", /^All/.test(chips[0]) && chips.some((c) => /^Data/.test(c)) && chips.some((c) => /^Programming/.test(c)) && chips.some((c) => /^Infrastructure/.test(c)) && chips.some((c) => /^AI/.test(c)), JSON.stringify(chips));
  check("no chip for a subject with no decks", !chips.some((c) => /^Cloud/.test(c)) || Number(sql(`select count(*) from "Deck" where 'cloud and networking' = any(tags) and visibility = 'PUBLIC' and status = 'APPROVED'`)) > 0);
  const dataChip = chips.find((c) => /^Data/.test(c));
  await subjects.getByRole("link", { name: /^Data/ }).click();
  await p.waitForURL((u) => u.searchParams.get("s") === "data");
  await p.waitForLoadState("networkidle");
  // Deck rows only: the tabs sheet (closed) has list items of its own.
  const rows = (await mine.getByRole("listitem").count()) + (await more.getByRole("listitem").count());
  check("Data chip count equals the decks shown", Number(dataChip.replace(/\D+/g, "")) === rows, `${dataChip} vs ${rows}`);
  check("Data is current", (await subjects.getByRole("link", { name: /^Data/ }).getAttribute("aria-current")) === "page");
  const dataText = await p.locator("main").innerText();
  check("Data shows SQL basics and TT Microsoft Excel, not Python", dataText.includes("SQL basics") && dataText.includes("TT Microsoft Excel") && !dataText.includes("TT Python for beginners"));
  await p.goto(`${BASE}/tech?s=nonsense`, { waitUntil: "networkidle" });
  check("an unknown subject shows all, with All current", (await subjects.getByRole("link", { name: /^All/ }).getAttribute("aria-current")) === "page" && (await p.locator("main").innerText()).includes("TT Python for beginners"));

  await p.getByRole("link", { name: "Open TT Microsoft Excel" }).click();
  await p.waitForURL((u) => u.pathname === "/library/ttexcel000000000001");
  check("Open lands on the library deck page", /TT Microsoft Excel/.test(await p.locator("h1").first().innerText()));

  // Hiding Tech keeps its page reachable and marked current there.
  const hide = await api(p, "/api/study-tabs", { action: "arrange", tabs: [{ key: "english", hidden: false }, { key: "tech", hidden: true }, { key: "decks", hidden: false }] });
  check("Tech can be hidden", hide.status === 200);
  await p.goto(`${BASE}/flashcards`, { waitUntil: "networkidle" });
  check("hidden Tech is not in the bar elsewhere", (await area.getByRole("link", { name: "Tech", exact: true }).count()) === 0);
  await p.goto(`${BASE}/tech`, { waitUntil: "networkidle" });
  check("…but shows, current, on its own page", (await area.getByRole("link", { name: "Tech", exact: true }).getAttribute("aria-current")) === "page");
  sql(`delete from "StudyTab" where "userId" = ${user("new@test.local")}`);

  for (const w of [360, 390]) {
    await p.setViewportSize({ width: w, height: 800 });
    await p.goto(`${BASE}/tech`, { waitUntil: "networkidle" });
    check(`${w}: no sideways page scroll`, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  }
  await p.setViewportSize({ width: 390, height: 844 });
  check("no page errors", p.errors.length === 0, p.errors.join(" | "));

  const g = await login(browser, "guest", 390);
  await g.goto(`${BASE}/tech`, { waitUntil: "networkidle" });
  const gText = await g.locator("main").innerText();
  check("guest: library tech decks, nothing private", gText.includes("TT Microsoft Excel") && !gText.includes("TT Secret SQL") && !gText.includes("SQL basics"));
  await g.context().close();

  await p.goto(`${BASE}/tech`, { waitUntil: "networkidle" });
  await axe(p, "tech");
  await p.goto(`${BASE}/tech?s=data`, { waitUntil: "networkidle" });
  await axe(p, "tech data", ["light", "dark"]);

  sql(`delete from "Deck" where title like 'TT %'`);
  await browser.close();
  done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
