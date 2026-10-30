// Owns the checks that addresses nobody typed by hand cannot break the public
// library: repeated and malformed query values, NUL bytes, huge page numbers,
// SQL-looking text, and bad ids and percent-encoding in the path. Each is loaded
// in a real browser and must show the list, the deck, "not found" or a 400.
//
// It deliberately does NOT start the app or the database; README.md says how.

const { chromium, BASE, check, done } = require("../profile-e2e/lib.cjs");
const IDS = JSON.parse(process.env.IDS);
const P = IDS.pub;
// kind: "list" = the library list renders; "nf" = not-found; "deck" = the deck renders
const CASES = [
  ["/library", "list"],
  ["/library?q=a&q=b", "list"],
  ["/library?tag=a&tag=b", "list"],
  ["/library?sort=liked&sort=new", "list"],
  ["/library?page=2&page=3", "list"],
  ["/library?q=%00", "list"],
  ["/library?tag=%00", "list"],
  ["/library?q=a%00b&tag=x", "list"],
  ["/library?q[a]=1", "list"],
  ["/library?q=%ZZ", "list"],
  ["/library?page=999999999999999999999999", "list"],
  [`/library/${P}`, "deck"],
  [`/library/${P}?page=2&page=3`, "deck"],
  [`/library/${P}?page=%00`, "deck"],
  ["/library/doesnotexist", "nf"],
  ["/library/%00", "nf"],
  ["/library/%E0", "bad"],
  [`/library/${P}/card/%00`, "nf"],
  [`/library/${P}/card/%E0`, "bad"],
  ["/library/..%2f..%2fetc", "nf"],
  [`/library/${P}%20`, "nf"],
];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  for (const [path, want] of CASES) {
    const res = await p.goto(BASE + path, { waitUntil: "networkidle" }).catch((e) => ({ status: () => 0, err: e.message }));
    await p.waitForTimeout(400);
    const body = (await p.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ");
    const kind = (res && res.status && res.status() === 400) ? "bad" : /This page did not load/.test(body) ? "ERROR" : /Flashcard library/.test(body) ? "list" : /could not find that page|not found/i.test(body) ? "nf" : /Sign in to study or copy/.test(body) ? "deck" : "other";
    const status = res && res.status ? res.status() : 0;
    check(`${path.length > 60 ? path.slice(0, 57) + "…" : path}`, kind === want && status !== 500 && (want !== "bad" || status === 400), `shows ${kind}, HTTP ${status}`);
  }
  await b.close();
  done();
})();
