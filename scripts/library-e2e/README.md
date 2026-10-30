# Library tests

Checks for the public library (`docs/PUBLIC-LIBRARY-PLAN.md`): Library in place of Class in the navigation, the library open to a visitor, robots.txt and the sitemap, the list's pages and topics, hostile addresses, and the "anyone can read a published deck" consent. They use the Profile suite's helpers (`../profile-e2e/lib.cjs`).

| Suite | What it checks |
|---|---|
| `open-and-nav` | Phone bar and computer header: Dashboard, Flashcard, Audited, Library, Profile (no Class), Library lit on the list and on a deck; footer link row starts with Library; the menu keeps its groups and its own Library row, and its first group copies the bar; Settings still `/settings`; `/class` still opens; the teacher header is unchanged; a visitor gets the library list, a deck and a card with the public header and no student bar, only listed decks, search, one sign-in call to action, like and report as sign-in links; study and practice still go to /login; a rejected deck leaves; `/d/<token>` stays `noindex`; axe in five themes |
| `seo` | robots.txt (signed-in areas disallowed, `/d/` and the library not), sitemap.xml (one entry per listed deck, none hidden, none for cards, a takedown leaves at once), title, description, canonical and robots tags on the list (plain and each variant), a deck (own and no description, long description, page 2), a card, About, home, the share-link page. `EXPECT_BASE=none` is the variant for a build with no site address |
| `browse` | 34 listed decks in pages of 24; no deck twice or missing in any sort (30 decks share one `reviewedAt`); pager and chip links and what they keep; six bad page numbers; topic counts equal the database; a hidden deck's topic never shows; eight chips and the fold; "30 decks match"; noindex on variants; a rejection and a suspension change the numbers |
| `browse-ui` | Clicking a topic, Next, Previous, a search inside a topic, All topics; Enter on "More topics"; as a visitor and a student, 390 and 1280 px; no sideways scroll; axe in five themes |
| `hostile` | 21 addresses nobody typed by hand (repeated `?q=`, NUL bytes, huge page numbers, `' OR 1=1--`, bad ids, `%E0`) each show the list, the deck, "not found" or a 400, never "This page did not load" |
| `consent` | The new wording on Privacy, Terms, Library rules, Help and Profile; the fourth required tick (server refuses without it, the form shows it and says what to tick); the terms version `2026-10-29` stamped on a submitted deck; the deck panel once approved; Admin → Announcements offers the two drafts in order (saved as drafts only, nothing sent) |
| `unit.ts` | Pure functions, no app needed: `siteUrl` and `canonical` (including a value with no `https://`), `queryText`, `queryPage`, `readView`, `isRecordId`, `libraryHref`, the two announcement drafts |

**Local only.** `seed.cjs` deletes and remakes every deck whose title starts with `E2E ` and refuses to run unless `DATABASE_URL` is a localhost database. `consent` also deletes every announcement. `psql` must be installed (the suites change a deck and read the page on the next line).

## Run

1. Start a local Postgres, put its URL in `.env` as `DATABASE_URL` (and `DIRECT_URL`), and set `AUTH_SECRET`, `AUTH_TRUST_HOST=true` and `NEXT_PUBLIC_APP_URL="http://localhost:3000"` (the `seo` suite expects canonical links on that address). Leave `SUPABASE_URL` and the service key out. Create the tables:

```bash
npx prisma db push
```

2. Build and start the **production** app (the suites expect `next start`; the library works on `npm run dev` too, but its emails and not-found handling differ):

```bash
npm run build
```

```bash
npm run start
```

3. `axe-core` is not a project dependency; add it without saving:

```bash
npm i --no-save axe-core@4.10.3
```

4. Run every suite (each one reseeds first), or name some (`seo hostile`):

```bash
NODE_PATH="$(npm root -g)" node scripts/library-e2e/run.cjs
```

```bash
npx tsx scripts/library-e2e/unit.ts
```

`NODE_PATH` lets the scripts find a globally installed Playwright, as for the Profile suites.

## Other builds

- **No site address:** build and start with `NEXT_PUBLIC_APP_URL` empty (and `VERCEL_PROJECT_PRODUCTION_URL` unset), then run `EXPECT_BASE=none NODE_PATH="$(npm root -g)" node scripts/library-e2e/run.cjs seo`. A value without `https://` (for example `edusarthi.com`) must behave the same way: every page 200, no canonical tag, no `Sitemap:` line.
- **Photos** (Profile suites `p5`, `p6`) need `npm run dev`: local file storage is switched off in production.

## Known, not counted as failures

On every page of the app, axe reports the logotype's contrast in the light theme and the header's unlabelled navs (`docs/PROJECT-MEMORY.md`, Settings phase M). The suites leave those out.
