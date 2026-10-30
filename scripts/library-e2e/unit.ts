// Owns the library's pure-function checks: the site address and canonical tag,
// reading a library address safely (repeated values, NUL bytes, bad page
// numbers, bad ids), building one, and the two prepared announcement drafts.
// They need no app, no browser and no database content.
//
// Run from the repository root:  npx tsx scripts/library-e2e/unit.ts

import { announcementDraftSchema } from "../../lib/announcementSchemas";
import { libraryOpenDraft, nextDraft, termsUpdateDraft } from "../../lib/announcements";
import { isRecordId, libraryHref, queryPage, queryText, readView } from "../../lib/libraryUrl";
import { canonical, siteUrl } from "../../lib/siteUrl";

let bad = 0;
function ok(name: string, condition: boolean, extra = "") {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!condition) bad++;
}
const env = process.env as Record<string, string | undefined>;

// ---- siteUrl and canonical: the address search engines see ----
const addresses: [string, Record<string, string | undefined>, string | null][] = [
  ["configured, trailing slash trimmed", { NEXT_PUBLIC_APP_URL: "https://edusarthi.com/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app", NODE_ENV: "production" }, "https://edusarthi.com"],
  ["configured beats Vercel", { NEXT_PUBLIC_APP_URL: "https://a.example", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app", NODE_ENV: "production" }, "https://a.example"],
  ["a base path is kept, its slash trimmed", { NEXT_PUBLIC_APP_URL: "https://a.example/app/", VERCEL_PROJECT_PRODUCTION_URL: undefined, NODE_ENV: "production" }, "https://a.example/app"],
  ["spaces around it are ignored", { NEXT_PUBLIC_APP_URL: " https://a.example ", VERCEL_PROJECT_PRODUCTION_URL: undefined, NODE_ENV: "production" }, "https://a.example"],
  ["Vercel fallback", { NEXT_PUBLIC_APP_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: "edu-sarthi-nine.vercel.app", NODE_ENV: "production" }, "https://edu-sarthi-nine.vercel.app"],
  ["empty string counts as unset", { NEXT_PUBLIC_APP_URL: "", VERCEL_PROJECT_PRODUCTION_URL: undefined, NODE_ENV: "production" }, null],
  ["no https:// is not an address (the layout would throw 'Invalid URL')", { NEXT_PUBLIC_APP_URL: "edusarthi.com", VERCEL_PROJECT_PRODUCTION_URL: undefined, NODE_ENV: "production" }, null],
  ["a typo is not an address", { NEXT_PUBLIC_APP_URL: "http//x", VERCEL_PROJECT_PRODUCTION_URL: undefined, NODE_ENV: "production" }, null],
  ["only spaces is not an address", { NEXT_PUBLIC_APP_URL: "   ", VERCEL_PROJECT_PRODUCTION_URL: undefined, NODE_ENV: "production" }, null],
  ["not a web scheme", { NEXT_PUBLIC_APP_URL: "ftp://x.example", VERCEL_PROJECT_PRODUCTION_URL: undefined, NODE_ENV: "production" }, null],
  ["a bad value falls back to Vercel's", { NEXT_PUBLIC_APP_URL: "edusarthi.com", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app", NODE_ENV: "production" }, "https://x.vercel.app"],
  ["production with nothing: null, no throw", { NEXT_PUBLIC_APP_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: undefined, NODE_ENV: "production" }, null],
  ["development: localhost", { NEXT_PUBLIC_APP_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: undefined, NODE_ENV: "development" }, "http://localhost:3000"],
];
for (const [name, vars, want] of addresses) {
  for (const k of Object.keys(vars)) {
    if (vars[k] === undefined) delete env[k];
    else env[k] = vars[k];
  }
  const got = siteUrl();
  const c = canonical("/library");
  const canonOk = want === null ? Object.keys(c).length === 0 : c.alternates?.canonical === "/library";
  ok(`siteUrl: ${name}`, got === want && canonOk, String(got));
  if (got) ok(`siteUrl: ${name} → usable by new URL()`, (() => { try { new URL(got); return true; } catch { return false; } })());
}

// ---- reading a library address ----
ok("queryText: the first of a repeated value", queryText(["a", "b"], 10) === "a");
ok("queryText: nothing sent", queryText(undefined, 10) === "" && queryText([], 10) === "");
ok("queryText: NUL and control characters become spaces", queryText("a\u0000b\u0007c", 10) === "a b c");
ok("queryText: trimmed and cut to the limit", queryText("  hello world  ", 5) === "hello");
ok("queryPage: whole numbers from 1", queryPage("3") === 3 && queryPage("1.7") === 1 && queryPage("0") === 1 && queryPage("-3") === 1 && queryPage("abc") === 1 && queryPage(undefined) === 1);
ok("queryPage: huge and repeated", queryPage("999999999999999999999999") >= 1 && queryPage(["4", "9"]) === 4);
const v = readView({ q: ["  Verbs ", "x"], tag: "BULK", sort: ["liked", "new"], page: "2" });
ok("readView: first values, topic lowercased", v.q === "Verbs" && v.tag === "bulk" && v.sort === "liked" && v.page === 2, JSON.stringify(v));
ok("readView: an unknown sort is Newest", readView({ sort: "evil" }).sort === "new");
ok("readView: a search is cut at 60 and a topic at 24", readView({ q: "x".repeat(200) }).q.length === 60 && readView({ tag: "y".repeat(200) }).tag.length === 24);
ok("isRecordId: cuids and simple ids", isRecordId("cmvucjttr00017d572q89pk4k") && isRecordId("abc_DEF-1"));
ok("isRecordId: NUL, space, slash, dot, percent and empty are not ids", !["\u0000", "a b", "a/b", "a.b", "a%20", "", "x".repeat(65)].some(isRecordId));

// ---- building a library address ----
ok("libraryHref: the plain list is exactly /library", libraryHref({}) === "/library" && libraryHref({ sort: "new", page: 1 }) === "/library");
ok("libraryHref: only what is not the default", libraryHref({ q: "a b", tag: "verbs", sort: "liked", page: 3 }) === "/library?q=a+b&tag=verbs&sort=liked&page=3");

// ---- the prepared announcement drafts ----
const draft = libraryOpenDraft("https://edusarthi.example");
ok("draft: passes the announcement form's own schema", announcementDraftSchema.safeParse(draft).success);
ok("draft: links carry the site address", ["/legal/terms", "/legal/privacy", "/legal/library-rules"].every((p) => draft.body.includes(`https://edusarthi.example${p}`)));
ok("draft: promises 7 days and names the choices", draft.body.includes("no earlier than 7 days") && draft.body.includes("withdraw a deck"));
ok("draft: names the Settings row as it is called", draft.body.includes("Settings → Name on public decks"));
ok("draft: the earlier Terms update still passes", announcementDraftSchema.safeParse(termsUpdateDraft("https://x")).success);
const first = termsUpdateDraft("s").subject;
const second = draft.subject;
ok("nextDraft: Terms update first, then the library one, then blank", nextDraft("s", [])?.subject === first && nextDraft("s", [first])?.subject === second && nextDraft("s", [first, second]) === null);

process.exit(bad ? 1 : 0);
