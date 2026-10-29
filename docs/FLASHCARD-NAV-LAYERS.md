# Flashcard tab navigation in layers — proposal

Status: **PROPOSAL, not approved, nothing built.** Written 29 Oct 2026 on branch
`claude/modest-darwin-zfo3g1`. Scope: only the navigation above the card
(`components/flashcards/DeckTopBar.tsx`). The card itself does not change
(owner's instruction in this chat).

## What exists today

One sideways-scrolling row (`DeckTopBar`), in this order: card kinds (Words · Chunk ·
Grammar · Support) · Words-only section chips · deck links (My decks · Explore ·
Library · Institute) · "⏭ N skipped" · remark lists (⭐ ❤️ ❓ 💯 with counts) ·
today's count (due · new · known). A second row only on Chunk (types) and
Support (channel + level). During "Study this list", `ListSessionBar` replaces it.
On a phone the row is roughly three screens wide (an estimate from the chip
widths, not measured), so the lists and the count sit off-screen.

## Owner's idea (29 Oct)

Filters in layers: a top layer of main sections, a second layer inside the
section, and a third layer that filters the second.

Owner's answers in this chat:
- Top layer: English (now), Computer / Tech, My decks, Library / Institute, and
  users should be able to make their own, like a file, folder or playlist.
- Second layer under English: Words · Chunk · Grammar ("sentence" meant Grammar).
- Third layer: opens on tap, not always shown.
- Where the lists, count, skipped and deck links go: Claude to recommend.

## Recommendation

1. **Layer 1, fixed tabs (underline):** English · Tech · My decks · Library.
   Four fixed items fit a phone without scrolling. User-made folders and
   playlists go in layer 2 of My decks, not layer 1: their number has no limit,
   and layer 1 would become a scrolling row again.
2. **Layer 2, chips:**
   - English: Words · Chunk · Grammar · Support.
   - Tech: one chip per subject (Excel, Python, SQL, Linux, …). Scrolls, with a
     fade on the edge that still has chips.
   - My decks: All · the user's folders · + New folder.
   - Library: Explore · Library · Institute · Following.
3. **Layer 3, a Filter button** at the end of the layer-2 row, with a badge
   showing how many filters are on. It opens a bottom sheet:
   - Chunk: Type. Support: Channel and Level. Words: the section families with
     a link to the existing sections page (30 sections is too many for a sheet).
     Grammar: nothing today; its 20-odd topic groups could be added later.
     Decks: chapters (cards already carry the chapter in `Word.category`).
   - Every tab: My lists (⭐ ❤️ ❓ 💯), moved here from the top row.
   - Clear all and Apply fixed at the bottom of the sheet.
4. **Status line** right above the card, small text: the filters that are on,
   each removable with ✕, then today's count. "⏭ N skipped · show again" shows
   here only when there are skipped cards.
5. Deck links leave the row: My decks and Library become layer-1 sections,
   Explore and Institute go into Library's layer 2. All stay in the ☰ menu.
6. Chips at least 32px tall (today's second-row chips are about 20px, under the
   24px of WCAG 2.5.8 unless the spacing exception applies). Links keep
   `aria-current`; no `role="tablist"`, because each choice loads a new URL.

Cost: three rows take more height than today's one or two, so the card gets
somewhat shorter on a phone.

## Phases

- **Phase 1, no database change:** layers 1 to 3, the status line, moving the
  lists and links. Touches more than 6 files, so a file plan needs approval first.
- **Phase 2, database change:** user folders or playlists. Additive (a new
  table, plus a link from Deck); no existing data lost.

## Open questions (owner to decide)

- Folder or playlist: can one deck sit in one folder only, or in many playlists?
- Tech vs Library: is Tech only EduSarthi's own tech decks, with everyone
  else's decks under Library?
- Which tech decks are in the live database (not checked from here).
- Approve Phase 1 and its file plan.

## Sources used

Android Developers, Tabs (primary vs secondary tabs); Apple HIG, Segmented
controls (about five segments on iPhone); Material Design 2, Tabs (fixed vs
scrollable); Baymard Institute, horizontal tabs on mobile (hidden tabs get
missed); eBay Playbook, Filter chip (do not navigate with filter chips); SAP
Fiori, Filter feedback bar; DevExpress and Bright HR filtering guides (bottom
sheet for many filters); W3C, WCAG 2.2 SC 2.5.8.
