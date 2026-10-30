// Owns the checks on robots.txt, sitemap.xml and the head tags of the public
// library pages (title, description, canonical, robots, share tags), plain HTTP
// against a local production server. EXPECT_BASE=none runs the variant for a
// build made with no site address, where the canonical tag and the sitemap are
// left out on purpose.
//
// It deliberately does NOT start the app or the database; README.md says how.

const BASE = process.env.PROFILE_E2E_BASE || "http://localhost:3000";
const IDS = JSON.parse(process.env.IDS);
const EXPECT_BASE = process.env.EXPECT_BASE; // undefined = a base is configured
const { sql } = require("./lib.cjs");

let fails = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`); if (!ok) fails++; };
const get = async (p) => { const r = await fetch(BASE + p, { redirect: "manual" }); return { status: r.status, text: await r.text() }; };
const tag = (html, re) => (html.match(re) || [])[1];
const meta = (html, name) => tag(html, new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`));
const link = (html, rel) => tag(html, new RegExp(`<link rel="${rel}" href="([^"]*)"`));
const title = (html) => tag(html, /<title>([^<]*)<\/title>/);
const decode = (s) => (s ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

(async () => {
  const b = BASE;
  const { pub, imported, pubCard } = IDS;

  // ---- robots.txt ----
  const robots = (await get("/robots.txt")).text;
  check("robots: allows /", /^Allow: \/$/m.test(robots));
  check("robots: signed-in areas and APIs disallowed", ["/api/", "/dashboard", "/decks", "/admin", "/queue", "/library/*/study", "/library/*/practice/"].every((p) => robots.includes(`Disallow: ${p}`)));
  check("robots: the library and the share-link pages are NOT disallowed (noindex must stay readable)", !/^Disallow: \/library$/m.test(robots) && !/^Disallow: \/d(\/|$)/m.test(robots) && !/^Disallow: \/about/m.test(robots));
  if (EXPECT_BASE === "none") check("robots: no Sitemap line when the address is unknown", !/^Sitemap:/m.test(robots));
  else check("robots: Sitemap line", robots.includes(`Sitemap: ${b}/sitemap.xml`));

  // ---- sitemap.xml ----
  const sm = await get("/sitemap.xml");
  check("sitemap: 200 and XML", sm.status === 200 && sm.text.includes("<urlset"));
  const locs = [...sm.text.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  if (EXPECT_BASE === "none") {
    check("sitemap: empty when the address is unknown", locs.length === 0, String(locs.length));
  } else {
    const deckLocs = locs.filter((l) => /\/library\/[^/]+$/.test(l));
    const expected = Number(sql(`select count(*) from "Deck" where visibility='PUBLIC' and status='APPROVED'`));
    check("sitemap: one entry per listed deck", deckLocs.length === expected && expected >= 2, `${deckLocs.length} of ${expected}`);
    check("sitemap: the two test decks are in it", locs.includes(`${b}/library/${pub}`) && locs.includes(`${b}/library/${imported}`));
    const hidden = sql(`select id from "Deck" where title in ('E2E Pending deck','E2E Private deck','E2E Link deck')`).split("\n");
    check("sitemap: pending, private and link-shared decks are not in it", hidden.length === 3 && hidden.every((h) => !sm.text.includes(h)));
    check("sitemap: no card pages, no filtered lists", !locs.some((l) => l.includes("/card/") || l.includes("?")));
    check("sitemap: home, library, about, legal", [`${b}/`, `${b}/library`, `${b}/about`, `${b}/legal/terms`, `${b}/legal/privacy`].every((l) => locs.includes(l)));
    check("sitemap: no signed-in pages", !locs.some((l) => /\/(dashboard|decks|admin|settings)/.test(l)));

    // A takedown leaves the sitemap at once, and an approval brings it back.
    sql(`update "Deck" set status='REJECTED' where id='${pub}'`);
    const after = (await get("/sitemap.xml")).text;
    check("sitemap: a rejected deck leaves at once", !after.includes(`/library/${pub}`) && after.includes(`/library/${imported}`));
    sql(`update "Deck" set status='APPROVED' where id='${pub}'`);
    check("sitemap: and returns when approved", (await get("/sitemap.xml")).text.includes(`/library/${pub}`));
  }

  // ---- library list ----
  const list = (await get("/library")).text;
  check("list: title and description", title(list) === "Flashcard library — EduSarthi" && /checked by an admin/.test(meta(list, "description") ?? ""));
  check("list: indexable", meta(list, "robots") === undefined);
  if (EXPECT_BASE !== "none") check("list: canonical is /library", link(list, "canonical") === `${b}/library`, String(link(list, "canonical")));
  else check("list: no canonical when the address is unknown", link(list, "canonical") === undefined);
  for (const q of ["?q=imported", "?tag=data", "?sort=liked", "?sort=copied"]) {
    const h = (await get(`/library${q}`)).text;
    check(`list ${q}: noindex, follow`, meta(h, "robots") === "noindex, follow", String(meta(h, "robots")));
    if (EXPECT_BASE !== "none") check(`list ${q}: canonical still /library`, link(h, "canonical") === `${b}/library`);
  }
  check("list ?sort=new is the plain list (indexable)", meta((await get("/library?sort=new")).text, "robots") === undefined);

  // ---- a deck ----
  const deck = (await get(`/library/${pub}`)).text;
  check("deck: title is '<deck> — EduSarthi'", title(deck) === "E2E Public deck — EduSarthi", String(title(deck)));
  check("deck: description is the deck's own", meta(deck, "description") === "Ten small words");
  check("deck: og:title and og:description follow the page", meta(deck, "og:title") === "E2E Public deck — EduSarthi" && meta(deck, "og:description") === "Ten small words" && meta(deck, "og:site_name") === "EduSarthi");
  check("deck: indexable", meta(deck, "robots") === undefined);
  if (EXPECT_BASE !== "none") check("deck: canonical", link(deck, "canonical") === `${b}/library/${pub}`);
  else check("deck: no canonical when the address is unknown", link(deck, "canonical") === undefined);
  check("deck: no creator name in title, description or og tags", !/Rahul/.test(`${title(deck)} ${meta(deck, "description")} ${meta(deck, "og:title")} ${meta(deck, "og:description")}`));
  const p2 = (await get(`/library/${pub}?page=2`)).text;
  check("deck ?page=2: noindex, follow", meta(p2, "robots") === "noindex, follow");
  const imp = (await get(`/library/${imported}`)).text;
  check("imported deck: own title and description", title(imp) === "E2E Imported deck — EduSarthi" && meta(imp, "description") === "Grouped by topic");

  // Without a description: card count and tags.
  sql(`update "Deck" set description=NULL where id='${pub}'`);
  const nodesc = (await get(`/library/${pub}`)).text;
  check("deck without description: '3 flashcards in the EduSarthi library: verbs.'", meta(nodesc, "description") === "3 flashcards in the EduSarthi library: verbs.", String(meta(nodesc, "description")));
  const long = "x".repeat(300);
  sql(`update "Deck" set description='${long}' where id='${pub}'`);
  const longd = meta((await get(`/library/${pub}`)).text, "description") ?? "";
  check("long description is cut to 155 with an ellipsis", longd.length === 155 && longd.endsWith("…"), String(longd.length));
  sql(`update "Deck" set description='Ten small words' where id='${pub}'`);

  // ---- a card ----
  const card = (await get(`/library/${pub}/card/${pubCard}`)).text;
  check("card: title names the card and the deck", title(card) === "run — E2E Public deck — EduSarthi", String(title(card)));
  check("card: description names the deck", decode(meta(card, "description")) === "A flashcard from “E2E Public deck” in the EduSarthi library.", String(meta(card, "description")));
  check("card: noindex, follow", meta(card, "robots") === "noindex, follow");
  const badCard = await get(`/library/${pub}/card/nope`);
  check("unknown card: not-found page, noindex", meta(badCard.text, "robots") === "noindex" || meta(badCard.text, "robots") === "noindex, follow", String(meta(badCard.text, "robots")));
  const badDeck = (await get(`/library/doesnotexist`)).text;
  check("unknown deck: noindex", /noindex/.test(meta(badDeck, "robots") ?? ""));

  // ---- the rest of the site ----
  const about = (await get("/about")).text;
  check("about keeps its own title and og:title (not the home page's)", title(about) === "About — EduSarthi" && meta(about, "og:title") === "About — EduSarthi");
  const home = (await get("/")).text;
  check("home: Browse flashcard decks → /library", /<a href="\/library"[^>]*><button[^>]*>Browse flashcard decks<\/button><\/a>/.test(home) || (/href="\/library"/.test(home) && home.includes("Browse flashcard decks")));
  check("home: twitter card and site name", meta(home, "twitter:card") === "summary" && meta(home, "og:site_name") === "EduSarthi");
  const share = (await get("/d/e2elinktoken0000000000")).text;
  check("share link: still noindex, nofollow", meta(share, "robots") === "noindex, nofollow");
  check("study and practice still redirect a visitor", (await get(`/library/${pub}/study`)).status === 307 && (await get(`/library/${pub}/practice/${pubCard}`)).status === 307);

  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exitCode = fails ? 1 : 0;
})();
