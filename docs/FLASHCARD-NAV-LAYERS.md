# Flashcard tab navigation in layers — plan

Status: **PLAN, waiting for the owner's approval. Nothing is built yet.**
Branch `claude/modest-darwin-zfo3g1`, 29 Oct 2026.

Scope of this chat: **only the filter bar above the card** (today
`components/flashcards/DeckTopBar.tsx`). The card itself does not change.
The Library is being built in another chat, so this chat does not touch
`/library`, `/explore`, `/institute` or deck access rules.

## Owner's decisions (29 Oct)

| # | Decision | Status |
|---|---|---|
| 1 | Filters in three layers: main section → inside the section → a filter of that | ACTIVE |
| 2 | Top layer sections: English, Tech, My decks (Library later, from its own chat) | ACTIVE |
| 3 | Under English: Words · Chunk · Grammar (the owner's "sentence" meant Grammar), plus Support, which already exists | ACTIVE |
| 4 | The third layer opens on tap; it is not always on screen | ACTIVE |
| 5 | Users group decks in **playlists**: one deck can be in many playlists | ACTIVE; built later, not in this chat (database change) |
| 6 | Tech holds everything tech-related | ACTIVE; which decks count is still open (below) |
| 7 | The card does not change | ACTIVE |

## What exists today

One sideways-scrolling row: card kinds · Words-only section chips · deck links
(My decks, Explore, Library, Institute) · "⏭ N skipped" · remark lists
(⭐ ❤️ ❓ 💯) · today's count. A second row only on Chunk (types) and Support
(channel + level). During "Study this list", `ListSessionBar` replaces it (keep
that; see PROJECT-MEMORY "Don't undo").

## Target layout (phone)

```
English   Tech   My decks                 ← layer 1: tabs, underline
━━━━━━━
(Words) [Chunk] (Grammar) (Support) │ ⚙ 2 ← layer 2 chips; Filter button pinned right
Frames ✕            12 due · 10 new · 0/1183 known   ← status line
FRONT SIDE · RECOGNITION          1 / 3   ← card, unchanged
```

Filter button → `components/ui/Sheet` (bottom sheet on a phone, centred box
from sm up). Per tab:

- **Words:** Level (A1 · A2 · B1+) and a link "All sections →" to the existing
  sections page (30 sections is too many for a sheet). An active section shows
  "🔍 Search here".
- **Chunk:** Type (All · Frames · Prepositions · Collocations · Utterances · Polywords).
- **Grammar:** Topic (new filter; the cards' `details.group`, about 20 groups).
- **Support:** Channel (Voice · Chat · Email) and Level (Basic · Intermediate · Advanced).
- **Every tab:** My lists ⭐ ❤️ ❓ 💯 with counts (open the list, as today).

Status line: each active filter with ✕ (a link without that filter), the
skipped chip only when there are skipped cards, then today's count.

Deck links leave the row: My decks becomes a layer-1 tab; Explore, Library and
Institute stay in the ☰ menu until the Library chat decides their place.

## Rules the build must follow

- Server components; only the sheet's open/close is client code.
- Filters stay in the URL (`kind`, `type`, `ch`, `lv`, `sec`, `pack`, new
  `topic`), so back, refresh and sharing keep working. No database change.
- Colours only through tokens. Chips at least 32px tall (today's second-row
  chips are about 20px). Links keep `aria-current`; each nav has an
  `aria-label`; the Filter button says how many filters are on.
- Layer-2 chips scroll sideways with a fade on the edge that still has chips;
  the Filter button never scrolls away (a 360px phone has about 336px of room).
- Cost: three rows instead of one or two. The card gets an estimated 40–65px
  shorter on a phone.

## Phase 1 — English (this chat). 13 files, so this plan needs approval

| Step | File | What |
|---|---|---|
| 1 | `lib/filterNav.ts` (new) | The layers as data: sections, kinds, each kind's filter groups, link builders, the list of active filters. Pure, no database |
| 2 | `lib/flashcards.ts` | `grammarTopics()`: the distinct Grammar groups, one small SQL query, only on the Grammar tab |
| 3 | `components/ui/SheetLink.tsx` (new, client) | A link that closes the sheet it sits in |
| 4 | `components/flashcards/nav/AreaTabs.tsx` (new) | Layer 1 |
| 5 | `components/flashcards/nav/KindChips.tsx` (new) | Layer 2 and the pinned Filter button |
| 6 | `components/flashcards/nav/FilterSheet.tsx` (new) | Layer 3, the sheet's groups |
| 7 | `components/flashcards/nav/StatusLine.tsx` (new) | Active filters, skipped, today's count |
| 8 | `components/flashcards/DeckTopBar.tsx` | Rewritten to put the four together; keeps `DECK_KINDS` and `DECK_LISTS` |
| 9 | `app/(student)/flashcards/page.tsx` | Read `topic`, filter Grammar by it, pass the new props |
| 10 | `app/(shared)/decks/page.tsx` | Layer 1 on top of My decks, so the tabs stay in place |
| 11 | `app/(shared)/help/page.tsx` | The help answer that says the lists are "above the card" |
| 12 | `docs/FEATURE-MAP.md` | Where the lists and filters now are |
| 13 | `docs/PROJECT-MEMORY.md` and this file | What was built and what is open |

Testing before the push: local Postgres + dev server + Playwright at 360, 390
and 448px wide and on a computer; every filter of every tab gives the right
cards; back and refresh; a guest account; "Study this list" still replaces the
bar; axe in every theme; `tsc` and `next build`.

## Phase 2 — Tech (this chat, after the Library chat is merged)

Layer 2 = tech subjects (Excel, Python, SQL, Linux, Docker, Cloud, …) taken from
deck tags; the content is the list of matching decks; layer 3 = chapters
(`Word.category` on deck cards). Waits for the Library chat so the two chats do
not edit the same deck files, and so Tech shows decks by the Library's rules.

## Phase 3 — Playlists (another chat)

A new table for playlists and a link table for "deck in playlist" (many to
many). Additive: no existing data is lost. Then My decks' layer 2 becomes
All · each playlist · + New playlist.

## Open questions

- Which decks count as Tech: only EduSarthi's own decks, or also students' and
  teachers' decks with a tech tag? Needed before Phase 2.
- The exact list of tech subjects (the 21 FDE decks plus Excel, Python, SQL).
- Which tech decks are in the live database (not checked from here).

## Sources used for the recommendation

Android Developers, Tabs (primary and secondary tabs); Apple HIG, Segmented
controls; Material Design 2, Tabs (fixed vs scrollable); Baymard Institute,
horizontal tabs on mobile; eBay Playbook, Filter chip; SAP Fiori, Filter
feedback bar; DevExpress and Bright HR filtering guides; W3C, WCAG 2.2 SC 2.5.8.
