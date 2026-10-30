# Flashcard filters and study tabs — browser tests

Playwright checks for the filters above the card and the student's own study
tabs (`docs/FLASHCARD-NAV-LAYERS.md`):

| Suite | What it checks |
|---|---|
| `filters.cjs` | Two rows only at 360 and 390px; study tabs and today's count; every card kind; no chunk type, Support channel/level or section chips; the kind's chip naming a filter opened from Explore or a section, and tapping it to clear; skipped and "show again"; remark lists; My decks and back; Study this list replacing the bar; guest; teacher; the focus ring; no sideways scroll; axe in every theme |
| `tabs.cjs` | Make a tab (it opens), add and remove decks, Study links, arrange and hide (a hidden tab still shows on its own page, the last tab cannot be hidden, an out-of-date order is refused), rename, the "which tabs?" question after a copy (Save and Skip), deleting the open tab, a deleted deck leaving every tab, decks you cannot open refused, another student's tab not found and not changeable, at most 20 tabs under 25 parallel requests, the data download, teacher and guest, the fallback when the tables are missing, keyboard, axe in every theme with each sheet open |

**Local only.** The SQL helper (`scripts/library-e2e/lib.cjs`) refuses any
database that is not on localhost. `filters.cjs` deletes the tabs of
`new@test.local` and stars one card; `tabs.cjs` deletes that account's tabs,
decks and follows, and briefly renames the `StudyTab` table to check the
fallback (it renames it back even when a check fails).

## Run

1. A local Postgres in `.env` (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`,
   `AUTH_TRUST_HOST=true`), then the tables and the built-in cards:

```bash
npx prisma db push
```

```bash
npx tsx prisma/seed.ts
```

```bash
npx tsx prisma/import-words.ts
```

```bash
npx tsx prisma/import-chunks.ts
```

```bash
npx tsx prisma/import-support.ts
```

2. The test accounts and the library decks the copy checks use ("Interview
   answers", "Daily chunks", "Waiting deck"):

```bash
NODE_PATH="$(npm root -g)" node scripts/profile-e2e/seed.cjs
```

3. Start the app (`npm run dev`, or `npm run build` then `npm run start`), and
   add axe-core without saving it:

```bash
npm i --no-save axe-core@4.10.3
```

4. Run each suite:

```bash
NODE_PATH="$(npm root -g)" node scripts/flashcard-tabs-e2e/filters.cjs
```

```bash
NODE_PATH="$(npm root -g)" node scripts/flashcard-tabs-e2e/tabs.cjs
```

The library suites reseed their accounts' card progress; run
`scripts/profile-e2e/seed.cjs` again before these if you ran those first.

## Known, not counted as failures

As in the Profile suites: the logotype's contrast and the header's two
unlabelled navs (`scripts/profile-e2e/lib.cjs` leaves them out). A tab id that
is not yours shows the not-found page with HTTP 200, because
`app/(student)/loading.tsx` streams first; the check looks at the page, not
the status.
