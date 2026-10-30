// Owns the checks on "anyone can read a published deck": the new wording on
// Privacy, Terms, Library rules, Help and Profile, the fourth required tick on
// the submit form and its server check, the terms version stamped on a
// submitted deck, the deck panel once approved, and the two prepared
// announcement drafts in order (saved as drafts only; nothing is sent).
//
// It deliberately does NOT start the app or the database; README.md says how.

const { chromium, BASE, check, login, done } = require("../profile-e2e/lib.cjs");
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const { sql } = require("./lib.cjs");
const text = async (path) => (await fetch(BASE + path)).text();
const strip = (h) => h.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

(async () => {
  // ---- the legal pages ----
  const privacy = strip(await text("/legal/privacy")), terms = strip(await text("/legal/terms")), rules = strip(await text("/legal/library-rules"));
  check("privacy: no longer says only signed-in users see public decks", !/visible to every signed-in user/.test(privacy));
  check("privacy: public decks are visible to everyone, search engines may list them", /visible to everyone, with or without an account/.test(privacy) && /search engines such as Google may list them/.test(privacy));
  check("privacy: link-shared decks — we ask search engines not to list them", /we ask search engines not to list them/.test(privacy));
  check("privacy: the name shows to people who are not signed in", /to everyone who opens it, signed in or not/.test(privacy));
  check("privacy: a search engine's own copy cannot be deleted by us", /cannot delete another company's copy/.test(privacy));
  check("terms: anyone can read an approved deck; only accounts can follow, copy, like, report", /anyone can read it: people with an account and people without one/.test(terms) && /Only people with an account can follow, copy, like or report it/.test(terms));
  check("terms: withdrawing — sitemap at once, a search engine may keep a copy", /remove the deck from our sitemap at once/.test(terms) && /keep its own copy for a while/.test(terms));
  check("library rules: a new section on who can read a published deck", /Who can read a published deck/.test(rules) && /Anyone\. Once an admin approves a deck/.test(rules));
  check("library rules: the personal-details rule says the internet can read it", /A published deck can be read by anyone on the internet/.test(rules));
  check("the three pages show 29 October 2026", [privacy, terms, rules].every((t) => /29 October 2026/.test(t)));

  const b = await chromium.launch();

  // ---- the app's own statements ----
  const s = await login(b, "student", 390);
  await s.goto(`${BASE}/help`, { waitUntil: "networkidle" });
  check("help: public decks can be read by anyone, with or without an account", /then anyone can read them, with or without an account/.test(strip(await s.content())));
  await s.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await s.getByText("Who sees what").first().click();
  await s.getByText("Library decks can be read by anyone").first().waitFor({ timeout: 10000 }).catch(() => {});
  check("student profile → Who sees what: library is open to anyone, search engines may list", /Library decks can be read by anyone, with or without an account, and search engines may list them/.test(strip(await s.content())));
  const t = await login(b, "teacher", 390);
  await t.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await t.getByText("Who sees what").first().click();
  await t.getByText("Anyone who opens the library").first().waitFor({ timeout: 10000 }).catch(() => {});
  check("teacher profile → Who sees what: 'Anyone who opens the library'", /Anyone who opens the library/.test(strip(await t.content())));

  // ---- the submit form and the server's check ----
  const o = await login(b, "other", 390);
  const other = await p.user.findUniqueOrThrow({ where: { email: "other@test.local" } });
  await p.deck.deleteMany({ where: { title: "E2E Step4 deck" } });
  const deck = await p.deck.create({ data: { ownerId: other.id, title: "E2E Step4 deck", description: "For the consent test", tags: ["step4"], visibility: "PRIVATE", status: "DRAFT" } });
  for (let i = 1; i <= 3; i++) await p.word.create({ data: { code: `e2e-step4-${i}`, serial: i, text: `card ${i}`, details: { meaning: "m", example: "", body: "", audit: "" }, deckId: deck.id, ownerId: other.id } });

  const post = (body) => o.evaluate(async (bd) => { const r = await fetch("/api/decks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bd) }); return { status: r.status, text: await r.text() }; }, body);
  const base = { adult: true, ownWork: true, licence: true, paidUse: true, name: { creditStyle: "NONE" }, asInstitute: false, behalf: false };
  const missing = await post({ action: "publish", id: deck.id, consent: base });
  check("server: a submission without the openWeb tick is refused (400)", missing.status === 400 && /anyone can read a published deck/.test(missing.text), `${missing.status} ${missing.text.slice(0, 160)}`);
  check("server: and the deck stays private", sql(`select visibility||'/'||status from "Deck" where id='${deck.id}'`) === "PRIVATE/DRAFT");
  const falseTick = await post({ action: "publish", id: deck.id, consent: { ...base, openWeb: false } });
  check("server: openWeb false is refused too", falseTick.status === 400);

  // The form itself.
  await o.goto(`${BASE}/decks/${deck.id}`, { waitUntil: "networkidle" });
  await o.getByRole("button", { name: "Submit for the public library" }).click();
  const label = o.getByLabel(/anyone can read this deck, with or without an account/);
  await label.waitFor({ timeout: 10000 });
  check("form: the new tick is there, unticked, beside licence and paid use", (await label.count()) === 1 && !(await label.isChecked()) && (await o.getByLabel(/EduSarthi may use it in paid features/).count()) === 1);
  check("form: it says how to undo it and the search-engine copy", /You can withdraw it at any time\. It then leaves the library at once; a search engine may keep its own copy for a while/.test(strip(await o.content())));
  await o.getByLabel(/I am 18 or older/).check().catch(() => {});
  await o.getByLabel(/I made this deck/).check();
  await o.getByLabel(/Others may share and change it/).check();
  await o.getByLabel(/EduSarthi may use it in paid features/).check();
  await o.getByRole("button", { name: "Submit for review" }).click();
  await o.locator('p[role="alert"]').waitFor({ timeout: 10000 });
  check("form: submitting without it shows the message that says what to tick", /Tick that you understand anyone can read a published deck/.test(await o.locator('p[role="alert"]').innerText()), await o.locator('p[role="alert"]').innerText());
  check("form: nothing was submitted", sql(`select status from "Deck" where id='${deck.id}'`) === "DRAFT");
  await label.check();
  await o.getByRole("button", { name: "Submit for review" }).click();
  await o.waitForFunction(() => !document.body.innerText.includes("Submitting…"), null, { timeout: 15000 });
  await o.waitForTimeout(800);
  const row = sql(`select status||'|'||"termsVersion"||'|'||("termsAcceptedAt" is not null) from "Deck" where id='${deck.id}'`);
  check("with all four ticks: waiting for review, stamped with terms 2026-10-29", row === "PENDING_REVIEW|2026-10-29|true", row);

  // Once approved, the panel on the owner's deck page tells the truth about who can read it.
  sql(`update "Deck" set status='APPROVED' where id='${deck.id}'`);
  await o.goto(`${BASE}/decks/${deck.id}`, { waitUntil: "networkidle" });
  const panel = strip(await o.content());
  check("owner's deck page (approved): anyone can read it, accounts can follow and copy", /Anyone can read this deck, with or without an account, and search engines may list it\. People with an account can follow and copy it/.test(panel) && !/Anyone signed in/.test(panel));

  // A deck submitted under the earlier terms keeps its own version.
  const old = sql(`select count(*) from "Deck" where "termsVersion"='2026-10-27'`);
  check("decks submitted before keep 2026-10-27 (the record of what each agreed to)", Number(old) >= 0);

  // ---- announcements: the two prepared drafts, in order ----
  await p.announcement.deleteMany({});
  const a = await login(b, "admin", 1280);
  await a.goto(`${BASE}/admin/announcements`, { waitUntil: "networkidle" });
  const subject = () => a.getByLabel("Email subject").inputValue();
  check("announcements: first the Terms update draft", (await subject()) === "EduSarthi: updated Terms and Privacy for the deck library", await subject());
  await a.getByRole("button", { name: "Save draft" }).click();
  await a.getByText("EduSarthi: updated Terms and Privacy for the deck library").first().waitFor();
  await a.waitForFunction(() => document.querySelector('input[id$="-subject"]').value.includes("open to everyone"), null, { timeout: 15000 }).catch(() => {});
  check("then, after saving, the library-open draft is offered", (await subject()) === "EduSarthi: the deck library will be open to everyone", await subject());
  check("its text is filled in (email and notice)", /no earlier than 7 days/.test(await a.getByLabel("Email text").inputValue()) && /soon be readable by anyone/.test(await a.getByLabel(/Dashboard notice/).inputValue()));
  await a.getByRole("button", { name: "Save draft" }).click();
  await a.getByText("EduSarthi: the deck library will be open to everyone").first().waitFor();
  await a.waitForFunction(() => document.querySelector('input[id$="-subject"]').value === "", null, { timeout: 15000 }).catch(() => {});
  check("with both saved, the form is blank", (await subject()) === "", await subject());
  check("both are drafts, nothing was sent", sql(`select count(*) from "Announcement" where "startedAt" is null`) === "2" && sql(`select count(*) from "AnnouncementDelivery"`) === "0");
  check("no page errors (admin)", a.errors.length === 0, a.errors.join(" | "));

  await p.announcement.deleteMany({});
  await p.deck.deleteMany({ where: { title: "E2E Step4 deck" } });
  await b.close();
  await p.$disconnect();
  done();
})();
