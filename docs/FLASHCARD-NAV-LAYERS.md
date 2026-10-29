# Flashcard tab filters in layers — plan and build record

Status: **BUILT and tested locally, not merged.** Branch
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
| 5 | Users group decks in **playlists**: one deck can be in many playlists | ACTIVE; a later database change, not in this chat |
| 6 | Tech holds everything tech-related | ACTIVE; which decks count is still open |
| 7 | The card does not change | ACTIVE |
| 8 | Where the count, lists, skipped and deck links go: Claude to recommend | Done, see below |

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

## Still to do

- **Tech** (this chat, after the Library chat is merged): tech subjects from
  deck tags as layer 2, the matching decks as content. Open: only EduSarthi's
  own tech decks, or students' and teachers' tech-tagged decks too? Which tech
  decks are in the live database was not checked from here.
- **Playlists** (another chat): a playlist table and a "deck in playlist" link
  table (many to many). Additive, no data lost. Then My decks' layer 2 becomes
  All · each playlist · + New playlist.
- Not asked for, noted only: `/flashcards` has no `<h1>` (axe best practice).

## Sources used for the recommendation

Android Developers, Tabs (primary and secondary tabs); Apple HIG, Segmented
controls; Material Design 2, Tabs (fixed vs scrollable); Baymard Institute,
horizontal tabs on mobile; eBay Playbook, Filter chip (do not navigate with
filter chips); SAP Fiori, Filter feedback bar; W3C, WCAG 2.2 SC 2.5.8 (24px
targets).
