# Flashcard tab filters in layers — plan and build record

Status: **Phase 1 BUILT and tested locally, not merged.** Branch
`claude/modest-darwin-zfo3g1`, 29 Oct 2026.

Scope of this chat: **only the filters above the card** (`DeckTopBar` and its
parts). The card itself does not change. The Library is being built in another
chat, so this chat does not touch `/library`, `/explore`, `/institute` or deck
access rules.

## Owner's decisions (29 Oct)

| # | Decision | Status |
|---|---|---|
| 1 | Filters in layers: main section → inside the section → that kind's own filters | ACTIVE |
| 2 | Top layer: English, Tech, My decks (Library later, from its own chat) | ACTIVE; Tech not built yet |
| 3 | Under English: Words · Chunk · Grammar (the owner's "sentence" meant Grammar), plus Support, which already existed | ACTIVE, built |
| 4 | Third layer opens on tap (a Filter sheet) | **SUPERSEDED the same day:** "Layer 3 plan se hata do, build nahi karna hai, layer 2 tak hi sahi hai". No sheet. |
| 5 | Users group decks in **playlists**: one deck can be in many playlists | ACTIVE; a later database change, not in this chat |
| 6 | Tech holds everything tech-related | ACTIVE; which decks count is still open |
| 7 | The card does not change | ACTIVE |
| 8 | Where the count, lists, skipped and deck links go: Claude to recommend | Done, see below |

Interpretation recorded so the next chat does not undo it: removing "layer 3"
was read as **do not build the sheet**. The filters that already existed (word
sections, chunk types, Support channel and level) were kept where they were,
in the row right above the card. Removing them would be a one-file change in
`DeckTopBar.tsx` if the owner wants it.

## What was built

```
English   My decks          0 due · 10 new · 0/1183 known   ← row 1
━━━━━━━
(Words) [Chunk] (Grammar) (Support)                         ← row 2
[All] Frames  Prepositions  Collocations … │ ⭐ 0 ❤️ 0 ❓ 0 💯 0   ← row 3
FRONT SIDE · RECOGNITION                              1 / 3 ← card, unchanged
```

- Row 1, `components/flashcards/AreaTabs.tsx`: underline tabs, links with
  `aria-current`. Only areas that work today are listed (an empty Tech tab
  would promise what is not there). Today's count sits at the row's right end
  (`DeckCount`, `components/flashcards/DeckLists.tsx`); on a 360px phone it
  wraps "0/1183 known" onto a second line inside the same height.
- Row 2: the four card kinds, as before.
- Row 3: the kind's own filters as before, then "⏭ N skipped" while there are
  skipped cards, then the remark lists (`DeckLists`). Small chips now 24px tall.
- Explore, Library and Institute are no longer in the bar; they are in the ☰
  menu. My decks shows row 1 to students, and its "← Word cards" link is gone.
- `components/flashcards/fadeRow.ts`: every scrolling row fades at its right
  edge and leaves room for the keyboard focus ring (it used to be cut off).
- `FlashcardDeck`: one computer-width card height for every tab,
  `calc(100dvh-19rem)`; the `tallTop` prop is gone.

### Changed from the plan while building, and why

- The plan had a separate status line for the count and lists. Measured, four
  rows cost 80–108px of card height on a phone. The count moved beside the
  tabs and the lists to the end of row 3, which brought it to 44–72px.
- The computer-width card height had to change (Known / Unknown ended 44–76px
  below an 800px window). Only the box's height changed, not the card.

### Measured (local Postgres, Playwright)

| Width | Before | After |
|---|---|---|
| 390px phone, card height | 571px (Words, Grammar), 543px (Chunk, Support) | 499px on every tab |
| 360px phone, card height | — | 498px on every tab; all four kinds fit; no sideways page scroll |
| 1280 × 800, bottom of Known | 800–804px | 796px |

### Tested

76 browser checks at 360 and 390px: every tab and filter link, Frames and
Support filters serve matching cards, tapping an active Support chip turns it
off, word sections, skip and "show again", remark list open and back, My decks
and back, focus ring room, Study this list replacing the bar, guest, teacher
(no tabs on My decks), no page errors. axe in all five themes on four pages:
only "page has no h1" on `/flashcards`, which was already there before this
branch. `tsc` and `next build` pass.

## Still to do

- **Tech** (this chat, after the Library chat is merged): tech subjects from
  deck tags as row 2, the matching decks as content, chapters
  (`Word.category` on deck cards) as filters. Open: only EduSarthi's own tech
  decks, or students' and teachers' tech-tagged decks too? Which tech decks
  are in the live database was not checked from here.
- **Playlists** (another chat): a playlist table and a "deck in playlist" link
  table (many to many). Additive, no data lost. Then My decks' row 2 becomes
  All · each playlist · + New playlist.
- Not asked for, noted only: `/flashcards` has no `<h1>` (axe best practice).

## Sources used for the recommendation

Android Developers, Tabs (primary and secondary tabs); Apple HIG, Segmented
controls; Material Design 2, Tabs (fixed vs scrollable); Baymard Institute,
horizontal tabs on mobile; eBay Playbook, Filter chip (do not navigate with
filter chips); SAP Fiori, Filter feedback bar; DevExpress and Bright HR
filtering guides; W3C, WCAG 2.2 SC 2.5.8 (24px targets).
