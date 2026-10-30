// Owns the checks on the library list's pages, topic chips and counts over HTTP:
// 34 listed decks in pages of 24, no deck twice or missing in any sort, the
// pager and chip links, bad page numbers, counts equal to the database, hidden
// decks' topics never shown, and a rejection or suspension changing the numbers.
//
// It deliberately does NOT start the app or the database; README.md says how.

const BASE = process.env.PROFILE_E2E_BASE || "http://localhost:3000";
const { sql } = require("./lib.cjs");
let fails = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`); if (!ok) fails++; };
const get = async (p) => (await fetch(BASE + p, { redirect: "manual" })).text();
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const deckIds = (h) => [...h.matchAll(/href="\/library\/([a-z0-9]+)"/g)].map((m) => m[1]);
const anchor = (h, rel) => { const m = h.match(new RegExp(`<a[^>]*rel="${rel}"[^>]*>`)); return m ? decode((m[0].match(/href="([^"]*)"/) || [])[1] ?? "") : null; };
const meta = (h, name) => (h.match(new RegExp(`<meta name="${name}" content="([^"]*)"`)) || [])[1];
const pagerText = (h) => (h.replace(/<!-- -->/g, "").match(/<span class="font-mono text-xs text-ink-muted">(\d+) \/ (\d+)<\/span>/) || []).slice(1).join("/");
const countLine = (h) => (h.match(/<p class="mt-3 text-sm text-ink-muted">([^<]*(?:<!-- -->[^<]*)*)<\/p>/) || [])[1]?.replace(/<!-- -->/g, "");
const chipFor = (h, tag) => { const m = h.match(new RegExp(`<a[^>]*href="/library\\?[^"]*tag=${tag}(?:&amp;|")[^>]*>`)); return m ? m[0] : null; };

(async () => {
  const listed = Number(sql(`select count(*) from "Deck" where visibility='PUBLIC' and status='APPROVED'`));
  const p1 = await get("/library"), p2 = await get("/library?page=2");
  const a = deckIds(p1), b = deckIds(p2);
  check("setup: 34 listed decks", listed === 34, String(listed));
  check("page 1 shows 24 decks", a.length === 24, String(a.length));
  check("page 2 shows the other 10", b.length === 10, String(b.length));
  check("no deck twice, none missing (ties broken by id)", new Set([...a, ...b]).size === 34 && [...a, ...b].length === 34);
  check("heading and visitor wording", /Flashcard library/.test(p1) && /Anyone can read them/.test(p1) && !/Deck library/.test(p1));
  check("count line: '34 decks'", countLine(p1) === "34 decks", String(countLine(p1)));
  check("pager text 1 / 2 and 2 / 2", pagerText(p1) === "1/2" && pagerText(p2) === "2/2", `${pagerText(p1)} ${pagerText(p2)}`);
  check("page 1: Next → ?page=2, no Previous", anchor(p1, "next") === "/library?page=2" && anchor(p1, "prev") === null, String(anchor(p1, "next")));
  check("page 2: Previous → plain /library, no Next", anchor(p2, "prev") === "/library" && anchor(p2, "next") === null, String(anchor(p2, "prev")));
  for (const bad of ["99", "abc", "0", "-3", "1.7", ""]) {
    const h = await get(`/library?page=${bad}`);
    const want = bad === "99" ? "2/2" : "1/2";
    check(`?page=${bad || "(empty)"} shows the nearest real page`, pagerText(h) === want, pagerText(h));
  }
  for (const sort of ["liked", "copied"]) {
    const x = deckIds(await get(`/library?sort=${sort}`)), y = deckIds(await get(`/library?sort=${sort}&page=2`));
    check(`sort=${sort}: stable across pages (ties on 0 likes / copies)`, new Set([...x, ...y]).size === 34 && x.length + y.length === 34);
    const h2 = await get(`/library?sort=${sort}&page=2`);
    check(`sort=${sort}: Previous keeps the sort`, anchor(h2, "prev") === `/library?sort=${sort}`, String(anchor(h2, "prev")));
  }

  // ---- the topic row ----
  check("topic row: All topics is current on the plain list", /<nav aria-label="Topics"/.test(p1) && /<a[^>]*aria-current="true"[^>]*>All topics<\/a>/.test(p1));
  const bulkChip = chipFor(p1, "bulk");
  check("topic row: 'bulk' chip links to ?tag=bulk and shows 30", !!bulkChip && /href="\/library\?tag=bulk"/.test(bulkChip) && />bulk<span[^>]*>30<\/span>/.test(p1.replace(/<!-- -->/g, "")), String(bulkChip));
  const counts = {};
  for (const t of ["bulk", "topic-3", "verbs", "data"]) {
    const m = p1.replace(/<!-- -->/g, "").match(new RegExp(`tag=${t}"[^>]*>${t}<span[^>]*>(\\d+)</span>`));
    counts[t] = m ? Number(m[1]) : null;
  }
  const dbCount = (t) => Number(sql(`select count(*) from "Deck" where visibility='PUBLIC' and status='APPROVED' and '${t}' = any(tags)`));
  check("topic counts equal the database", Object.entries(counts).every(([t, c]) => c === dbCount(t)), JSON.stringify(counts));
  check("topics of pending and private decks never show", !/secret-tag/.test(p1 + p2));
  const more = p1.match(/More topics \((?:<!-- -->)?(\d+)(?:<!-- -->)?\)/);
  const allChips = [...p1.matchAll(/href="\/library\?tag=([^"&]+)"/g)].map((m) => m[1]);
  check("eight chips shown, the rest under 'More topics'", !!more && allChips.length === 8 + Number(more[1]) && /<details class="mt-1.5">/.test(p1), `${allChips.length} chips, more=${more && more[1]}`);
  const folded = allChips[allChips.length - 1];
  const hf = await get(`/library?tag=${folded}`);
  check(`choosing a folded topic (${folded}) opens the fold`, /<details class="mt-1.5" open=""/.test(hf) || /<details[^>]*\bopen\b/.test(hf));
  const hq = await get("/library?q=E2E&sort=liked");
  check("chips keep the search and sort but drop the page", decode((chipFor(hq, "bulk") || "").match(/href="([^"]*)"/)?.[1] ?? "") === "/library?q=E2E&tag=bulk&sort=liked");

  // ---- a topic ----
  const tb = await get("/library?tag=bulk"), tb2 = await get("/library?tag=bulk&page=2");
  check("tag=bulk: '30 decks match', 24 + 6", countLine(tb) === "30 decks match" && deckIds(tb).length === 24 && deckIds(tb2).length === 6, `${countLine(tb)} ${deckIds(tb).length}+${deckIds(tb2).length}`);
  check("tag=bulk: the chip is current, All topics is not", /<a[^>]*aria-current="true"[^>]*>bulk/.test(tb.replace(/<!-- -->/g, "")) && !/<a[^>]*aria-current="true"[^>]*>All topics/.test(tb));
  check("tag=bulk: Next keeps the tag", anchor(tb, "next") === "/library?tag=bulk&page=2", String(anchor(tb, "next")));
  const t3 = await get("/library?tag=topic-3");
  check("tag=topic-3: '2 decks match', no pager", countLine(t3) === "2 decks match" && pagerText(t3) === "", String(countLine(t3)));
  const one = await get("/library?tag=verbs");
  check("one match reads '1 deck matches'", countLine(one) === "1 deck matches", String(countLine(one)));
  const none = await get("/library?q=zzzzzzzz");
  check("no match: message, link to every deck, no count, no pager", /No deck matches that/.test(none) && /href="\/library"[^>]*>see every deck/.test(none) && countLine(none) === undefined && pagerText(none) === "");

  // ---- metadata ----
  check("plain list and ?page=1 are indexable", meta(p1, "robots") === undefined && meta(await get("/library?page=1"), "robots") === undefined);
  check("?page=2, ?tag=bulk and ?tag=bulk&page=2 are noindex, follow", [p2, tb, tb2].every((h) => meta(h, "robots") === "noindex, follow"));
  check("a variant's canonical is still /library", /<link rel="canonical" href="http:\/\/localhost:3000\/library"/.test(p2));

  // ---- a takedown and a suspension move the numbers ----
  const one30 = sql(`select id from "Deck" where title='E2E Bulk 05'`);
  sql(`update "Deck" set status='REJECTED' where id='${one30}'`);
  const rej = await get("/library");
  check("a rejected deck: 33 decks, bulk chip 29, topic-5 chip 1", countLine(rej) === "33 decks" && />bulk<span[^>]*>29<\/span>/.test(rej.replace(/<!-- -->/g, "")) && />topic-5<span[^>]*>1<\/span>/.test(rej.replace(/<!-- -->/g, "")), String(countLine(rej)));
  sql(`update "Deck" set status='APPROVED' where id='${one30}'`);
  sql(`update "User" set "suspendedAt"=now() where email='student@test.local'`);
  const susp = await get("/library");
  const left = Number(sql(`select count(*) from "Deck" d join "User" u on u.id=d."ownerId" where d.visibility='PUBLIC' and d.status='APPROVED' and u."suspendedAt" is null`));
  check("a suspended owner's decks leave the list and the topic counts", countLine(susp) === `${left} ${left === 1 ? "deck" : "decks"}` && !/tag=bulk/.test(susp), `${countLine(susp)} vs ${left}`);
  sql(`update "User" set "suspendedAt"=NULL where email='student@test.local'`);
  check("and come back when reinstated", countLine(await get("/library")) === "34 decks");

  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exitCode = fails ? 1 : 0;
})();
