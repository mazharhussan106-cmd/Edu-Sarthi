# Flashcard tab filters in layers — plan and build record

Status: **BUILT and tested locally, not merged** (filters in two layers, and the student's own tabs). Branch
`claude/modest-darwin-zfo3g1`, 29 Oct 2026.

Scope of this chat: **only the filters above the card** (`DeckTopBar` and its
parts). The card itself does not change. The Library is being built in another
chat, so this chat does not touch `/library`, `/explore`, `/institute` or deck
access rules.

## Owner's decisions (29 Oct)

| # | Decision | Status |
|---|---|---|
| 1 | Filters in layers: main section → inside the section | ACTIVE, built |
| 2 | Top layer: English, Tech, My decks (Library later, from its own chat) | ACTIVE; English and My decks built, Tech not yet |
| 3 | Under English: Words · Chunk · Grammar (the owner's "sentence" meant Grammar), plus Support, which already existed | ACTIVE, built |
| 4 | A third layer that opens on tap (a Filter sheet) | **SUPERSEDED:** "Layer 3 plan se hata do, build nahi karna hai, layer 2 tak hi sahi hai" |
| 4b | The existing third row (chunk types, Support channel and level, word sections) stays | **SUPERSEDED:** "Layer 3 v dikh raha hai use hata k banao". Removed. |
| 5 | Users group decks in **playlists**: one deck can be in many playlists | **SUPERSEDED by 9–10:** the playlists are the student's own layer-1 tabs, not chips inside My decks |
| 6 | Tech holds everything tech-related: **all** of it — EduSarthi's own decks and students' and teachers' (owner, 30 Oct) | ACTIVE, built 30 Oct |
| 7 | The card does not change | ACTIVE |
| 8 | Where the count, lists, skipped and deck links go: Claude to recommend | Done, see below |
| 9 | **＋ in layer 1:** every student creates and arranges their own layer-1 tabs | ACTIVE; plan below, waiting for approval |
| 10 | Only **decks** go in a tab, and **one deck can be in many tabs** | ACTIVE |
| 11 | On **Copy / Import**, ask which tab(s) the deck should show in (only then; not on Follow, not on a new deck) | ACTIVE |
| 12 | Students can also hide and reorder **English** and **My decks** | ACTIVE |

## What is built

```
English   My decks          0 due · 10 new · 0/1183 known   ← layer 1
━━━━━━━
(Words) [Chunk] (Grammar) (Support) │ ⭐ 0 ❤️ 0 ❓ 0 💯 0     ← layer 2
FRONT SIDE · RECOGNITION                              1 / 3 ← card, unchanged
```

- Layer 1, `components/flashcards/AreaTabs.tsx`: underline tabs, links with
  `aria-current`. Only areas that work today are listed (an empty Tech tab
  would promise what is not there). Today's count sits at the row's right end
  (`DeckCount`, `components/flashcards/DeckLists.tsx`); on a 360px phone it
  wraps "0/1183 known" onto a second line inside the same height.
- Layer 2, `components/flashcards/DeckTopBar.tsx`: the four card kinds, then
  "⏭ N skipped" while there are skipped cards, then the remark lists
  (`DeckLists`). The row scrolls sideways; on a 360px phone the lists are past
  the edge under a fade. They are also in the ☰ menu.
- **No third row.** Chunk types, Support channel and level, and the word
  section chips are gone from the bar. The URL filters still work (Explore
  links to one chunk type; a word section opens its own session), so the open
  kind's chip names the filter — "Chunk · Frames", "Support · Chat · Basic",
  "Words · A1 · Starter" — and tapping it shows the whole kind. **Don't undo:**
  without it a filter could be on with nothing on screen saying so.
- Explore, Library and Institute are no longer in the bar; they are in the ☰
  menu. My decks shows layer 1 to students, and its "← Word cards" link is gone.
- `components/flashcards/fadeRow.ts`: a scrolling row fades at its right edge
  and leaves room for the keyboard focus ring (it used to be cut off).
- `FlashcardDeck`: one computer-width card height for every tab,
  `calc(100dvh-17rem)`; the `tallTop` prop is gone. Only the box's height
  changed, not the card.

What the removal costs (told to the owner): nothing in the app links to the
Support channel or level any more, and while studying a word section there is
no "Search here" chip (the section page still has its own search box).

### Measured (local Postgres, Playwright)

| Width | Before | After |
|---|---|---|
| 390px phone, card height | 571px (Words, Grammar), 543px (Chunk, Support) | 531px on every tab |
| 360px phone | — | 530px; all four kinds fit; no sideways page scroll |
| 1280 × 800, bottom of Known | 800–804px | 796px |

### Tested

84 browser checks at 360 and 390px: two rows only, every kind link, the named
filter chip for a chunk type, Support channel and level and a word section,
and tapping it to clear, skip and "show again", remark list open and back, My
decks and back, focus ring room, Study this list replacing the bar, guest,
teacher (no tabs on My decks), no page errors. axe in all five themes on five
pages: only "page has no h1" on `/flashcards`, which was already there before
this branch. `tsc` and `next build` pass.

## Own tabs (decisions 9–12) — BUILT 30 Oct, tested locally, not merged

Approved by the owner ("start building next phase"). **Run Actions → Database
setup right after merging** (two new tables and one enum).

**Database (additive, nothing lost):** `StudyTab` (userId, `kind` ENGLISH /
DECKS / OWN, `name` for own tabs, `position`, `hidden`) and `StudyTabDeck`
(tabId + deckId as the key, both cascade). No column is added to `User` or
`Deck`, only Prisma relation fields.
- Changed from the plan, and why: the order and the hidden flags are **rows**,
  not a key in `User.preferences` — the settings save keeps only keys it knows
  (`prefsOf`), so a layout there would vanish on the next settings change; and
  not a new `User` column — every sign-in reads `User`, so a column the live
  database does not have yet breaks sign-in until Database setup runs. The
  built-in tabs get rows only the first time the student saves anything.
- Until Database setup has run, `AreaTabs` catches the error and shows English
  · My decks, so the Flashcard tab keeps working (tested by renaming the table).

**Rules as built:** students only (the API answers teachers and admins "not
enabled", and the copy flow then skips the question); guests refused with the
usual "add your email" message; 20 own tabs (held under a per-user lock: 25
parallel requests made exactly 20), 30-character names, 100 decks per tab; a
deck can go in a tab only if the student can open it (own, followed, shared
by name — `tabbableBy` in `lib/studyTabs.ts`, checked on every write and read);
at least one tab stays shown (screen and server); a hidden tab still shows
while you are on its page; an order sent from an out-of-date sheet is refused.

**Screens as built:**
- Layer 1 (`components/flashcards/AreaTabs.tsx`): the tabs in the student's
  order, scrolling with a fade, then **＋**, then today's count. On a phone
  (below 640px) the count shows only due and new, so the tabs have room to show
  that more follow; the known total shows from 640px up.
- ＋ opens "Your tabs" (`components/tabs/ArrangeTabs.tsx`): New tab (it opens
  the new tab), and every tab with show/hide, move up/down, and Rename / Delete
  for own tabs. Order and show/hide are saved together with "Save order".
- A tab's page `/tabs/<id>` (`app/(student)/tabs/[id]/page.tsx`): its decks as
  rows (cards, due today, Study → the deck's own study page, Remove from this
  tab) and "＋ Add decks" (`components/tabs/TabDeckPicker.tsx`). Another
  student's tab id shows the not-found page (HTTP 200, because
  `app/(student)/loading.tsx` streams first, as the library notes say).
- After "Copy to my decks" / "Make my own copy" succeeds
  (`components/decks/CopyDeckButton.tsx`): "Show this deck in which tabs?"
  (`components/tabs/PlaceDeckSheet.tsx`), tick boxes, a new-tab field, Save
  or Skip; then the copy opens as before.
- "Download my data" (`/api/me`) includes the tabs and their decks.
- `/flashcards` now has a screen-reader-only `<h1>` ("Flashcards · Words"),
  which clears the one axe finding the page had before this branch.

**API:** `app/api/study-tabs/route.ts` (GET own tabs for the copy question;
POST create, rename, delete, arrange, setDecks, removeDeck, placeDeck), Zod in
`lib/studyTabSchemas.ts`, queries in `lib/studyTabs.ts`.

**Tested** (local Postgres, production build): `scripts/flashcard-tabs-e2e/`
— `tabs.cjs` 58 checks and `filters.cjs` 104 checks, all passing, including
axe in all five themes with each sheet open; the library's `open-and-nav` and
`browse-ui` suites still pass (137 checks); `tsc` and `next build`.

## Tech tab (decision 6) — BUILT 30 Oct, tested locally, not merged

Owner, 30 Oct: "bana do", and Tech holds **all** tech decks.

- **A built-in tab** like English and My decks (`StudyTabKind.TECH`), so it can
  be moved and hidden from ＋. Default order: English · Tech · My decks.
- **`/tech`** (`app/(student)/tech/page.tsx`): layer 1, then layer 2 — All ·
  Programming · Data · Infrastructure · Cloud & networking · AI, with counts,
  only subjects that have decks (`/tech?s=data`) — then two lists: **Your tech
  decks** (own, shared with you, followed: Study) and **More in the library**
  (the library's and your institute's: Open, where they follow or copy).
- **Which decks** (`lib/techDecks.ts`): the union of rules that already exist —
  the library (`LISTED`), the student's own, shared with them by name, followed,
  and their institute's. Never another student's private deck or a deck in
  review. "All" means everyone's public decks, not anyone's private ones.
- **What is tech:** a deck's tags or title, matched as whole words.
  EduSarthi's imported decks carry one broad tag each
  (`prisma/import-decks.ts`), so those are the subjects. "excel", "data",
  "react", "cloud", "node", "code", "shell", "security" and "ai" count only as
  tags, never in a title ("Excel at interviews" is an English deck).
- **Tested:** `scripts/flashcard-tabs-e2e/tech.cjs` (37 checks) and
  `subjects.ts` (17 cases); the other two suites still pass with three
  built-in tabs (tabs 58, filters 104); production build.

## Still to do

- **Tech:** built. Which tech decks are in the live database was not checked
  from here; EduSarthi's 21 are added by Actions → "Flashcard decks" (import-decks).
- **Own tabs:** built; after merging, run Database setup and try it on a phone.

## Sources used for the recommendation

Android Developers, Tabs (primary and secondary tabs); Apple HIG, Segmented
controls; Material Design 2, Tabs (fixed vs scrollable); Baymard Institute,
horizontal tabs on mobile; eBay Playbook, Filter chip (do not navigate with
filter chips); SAP Fiori, Filter feedback bar; W3C, WCAG 2.2 SC 2.5.8 (24px
targets).
