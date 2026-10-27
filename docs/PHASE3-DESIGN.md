# Phase 3 design — small fixes live, big edits as a reviewed version

Status: **PROPOSAL, waiting for the owner's approval.** Part of `docs/LIBRARY-V2-PLAN.md`. Written 27 Oct 2026.

## What the owner decided (CONFIRMED)

- Small fixes go live without waiting for review. Small means: text of existing cards only; at most 30 characters changed per field; one fix per card per day; at most 10 cards a day per deck. A title change counts as a big edit. (Decisions 2, 10.)
- Every change is still checked by the admin. Small fixes are checked after they go live, big edits before. (Decision 6; Review point 1.)
- The approved version stays live while a big edit waits for review. (Decision 11.)

## How it works — in plain words

A published deck gets two ways to change:

1. **Fix a typo.** On the deck page, Edit a card as today. If the change is small, it goes live at once and appears in the admin's list "Fixes to check" with the text before and after. The admin presses Accept or Undo. If the change is too big, the app says so and offers the second way.
2. **Start a new version.** This makes a private working copy of the deck, with its pictures and audio. The creator changes anything there: add, remove or rewrite cards, the title, tags, video, the teacher's guide, AI cards. The library keeps showing the approved version the whole time. The creator submits the new version with the usual ticks, and the admin reviews it on the normal review page, with a summary such as "3 cards added, 2 changed, 1 removed".
   - **Approved:** the changes are copied into the live deck, onto the same cards, so followers keep their progress. Then the working copy is deleted.
   - **Rejected:** the creator sees the reason, fixes the working copy and submits again. The live deck never changed.
   - **Discard:** the working copy and its files are deleted.

Only decks that are **published (approved)** work this way. A deck that was never approved, was rejected, or is hidden by reports is edited directly, as today.

## Why a working copy, not a list of pending changes

The working copy is an ordinary deck, so the existing card editor, AI card maker, media upload and admin review page all work on it unchanged. A list of pending changes would need every editor screen to draw "live cards plus pending edits", which means far more new code and far more places for bugs.

## The technical shape

**Database (one migration, additive, no data loss):**
- `Deck.draftOfId`: on a working copy, the live deck it will replace. Unique, so one new version at a time per deck. SetNull: if the live deck is deleted, the working copy becomes an ordinary private deck.
- `Word.liveWordId`: on a working-copy card, the live card it came from. Null for a card added in the new version.
- New table `DeckChange`: one small fix (deck, card, who, the fields before and after, when, and when the admin accepted or undid it).

**Rules:**
- **Measuring "30 characters changed".** Letters added, removed or swapped (edit distance), per field: front, back, example and notes. A field whose length changes by more than 30 is big straight away.
- **"A day" is the IST day,** the same as the AI limits (`lib/aiLimits.ts`).
- **While a new version is in progress, small fixes on the live deck are paused** ("make the fix in your new version"). Otherwise, approving the new version would quietly overwrite a fix made after it was started.
- **A working copy is not one of the creator's 20 decks.** It doesn't show in My decks (the live deck shows "new version in progress"), can't be shared, followed, copied or studied, and never appears in the library.
- **On a live deck,** Add card, Delete card, the AI card maker and Deck details are replaced by "Start a new version". Edit stays, for small fixes.

**Approving a new version:** in one transaction:
- update only the live cards that really changed;
- move cards that were added in the new version into the live deck (same row, same code);
- delete live cards the new version removed;
- copy over the title, description and tags.

After the transaction, delete the files that were replaced. Unchanged cards cost nothing, so a typical new version is a few statements. *Risk:* a version that changes hundreds of cards could pass the 20-second transaction limit over the pooler. *Mitigation:* one batched update statement for all changed cards instead of one per card.

**Files (about 20; approval needed before building):**
- New: `lib/deckVersion.ts` (start, discard, merge, summary), `lib/smallFix.ts` (size rules, limits, log, undo), `components/decks/VersionPanel.tsx`.
- Changed:
  - `prisma/schema.prisma`
  - `lib/deckCopy.ts` (shares its card-and-file copying)
  - `lib/deckReview.ts` (approving a version merges it; `sendBackIfPublished` retired)
  - `app/api/decks/route.ts` (start or discard a version; live title and tags locked; drafts outside the deck limit)
  - `app/api/decks/[id]/cards/route.ts` (small-fix path; add and delete locked on live)
  - `app/api/decks/[id]/ai-cards/route.ts` (locked on live)
  - `app/api/decks/ai-cards/new-deck/route.ts` (deck limit without drafts)
  - `app/api/admin/decks/route.ts` (accept or undo a fix)
  - `app/(shared)/decks/page.tsx` (hide drafts; "new version in progress")
  - `app/(shared)/decks/[id]/page.tsx` (live mode and draft banner)
  - `components/decks/CardRow.tsx` (no Delete on live)
  - `components/decks/PublishPanel.tsx` (draft mode)
  - `app/(admin)/admin/decks/page.tsx` ("Fixes to check", "New version of …")
  - `app/(admin)/admin/decks/[id]/page.tsx` (version summary)

## What a follower sees

Nothing changes for followers until a version is approved. Then they get the new cards, and their progress on unchanged and changed cards is kept. **Progress on a card the new version removed is lost, because the card no longer exists.**

## Questions for the owner

1. **Small fixes pause while a new version is in progress.** OK?
2. **When the admin undoes a small fix,** should the creator be told? Recommended: an email (like the approve and reject emails), and a note on the deck page.
3. **Approve the approach** (working copy) **and the file list.**
