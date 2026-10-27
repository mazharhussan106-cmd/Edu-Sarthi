# Flashcard library v2 — plan

Status: **PLANNING. Nothing in this file is built yet.** Written 27 Oct 2026 on branch `claude/sweet-davinci-d313f6`.

This builds on `docs/flashcard-library-plan.md` (Phases 1–5 are built and in `main`, but **none of it has been tested on the live site**). The owner's answers below are confirmed decisions. Anything marked **PROPOSAL** is the assistant's suggestion and still needs the owner's yes.

## Owner's decisions (27 Oct 2026) — CONFIRMED

| # | Topic | Decision | Supersedes |
|---|---|---|---|
| 1 | Hosting | Vercel. Nothing has been tested live yet. | The open question "Vercel or Hostinger" |
| 2 | Editing a published deck | Small fixes go live without waiting for review. | "Editing a published deck sends it back to review" |
| 3 | Studying a library deck | Learners **follow** the original, so they get the author's fixes. Copying stays as an option. | Copying as the only way to study a library deck |
| 4 | Credit | Public decks show the creator's name, and the institute's logo on an institute's deck. The student chooses what is shown about them. A copy says "Copied from …". | "Library pages show no owner name" |
| 5 | Licence | Others may share and change public decks with credit (CC BY-SA 4.0). EduSarthi will use public decks in paid features later. | "Licence and credit undecided" |
| 6 | Review | Only the admin reviews. Every deck always needs review. No trusted-creator shortcut. | — (same as before) |
| 7 | Sharing | Both view-only and edit sharing. | "No can-edit sharing" |
| 8 | Age | Students under 18 cannot publish to the public library. | — (new) |

### Second round (27 Oct 2026) — CONFIRMED

| # | Topic | Decision | Supersedes |
|---|---|---|---|
| 9 | Institutes | Institutes may publish to the public library under their name and logo, after admin review like every deck. | "Institute decks stay inside the institute and are never in the public library" |
| 10 | Small fix size | One fix per card per day, at most 10 cards a day per deck, at most 30 characters changed per field. A title change was not answered, so it counts as a big edit. | — |
| 11 | Big edits | The approved version stays live while the edit waits for review. | "Editing a published deck sends it back to review" (for big edits) |
| 12 | Under 18 | The only restriction is publishing to the public library. Under-18s may share by link and edit private decks shared with them. They cannot edit a public deck, because their changes would be published. | — |
| 13 | Withdrawn decks | When an author withdraws a deck, followers lose it. A takedown removes it too. | — |
| 14 | Creator rewards | Creators get a revenue share, free AI cards and badges. Amounts and payouts are decided later, with the paid plans. | — |
| 15 | Edit sharing | Only by named invite, never by link. | — |
| 16 | Teacher's guide | Learners keep seeing the Teacher's guide on the back of a card. Only the input box in the editor is staff-only. | — (confirms how it works today) |
| 17 | Card recordings | A recording on a deck card stays at a minimum of 15 seconds. | — (confirms how it works today) |

## Review of the decisions — what they imply and where they clash

1. **Small fixes (2) clash with "every deck always reviewed" (6).** A fix that goes live without review is, for a while, unreviewed. **PROPOSAL:** small fixes go live at once *and* land in an admin list "Fixes to check", where the admin accepts or undoes each one. Every change is still reviewed by the admin: small ones after, big ones before. A strict size limit stops someone from changing an approved deck into something else one "small" fix at a time.
2. **Big edits are not covered by answer 2.** Today a bigger edit hides the whole deck from the library until it is approved again. With followers (3), that would cut off everyone studying it. **Confirmed (decision 11):** the approved version stays live; the edit waits as a draft version; approving it updates the same cards, so followers keep their progress.
3. **The institute logo (4) clashed with an existing decision.** Institute decks "stay inside the institute and are never in the public library". **Resolved by decision 9:** institutes may now publish to the library under their name and logo, after admin review.
4. **Paid use (5) needs its own permission.** CC BY-SA lets anyone, EduSarthi included, reuse a deck with credit. But paid features built on students' decks need a clear, separate permission that the creator agrees to when they submit: a tick box plus a clause in the Terms, saved with the date and the version of the terms. The wording needs a lawyer. If any real person already has a public deck when this ships, they must agree before their deck is used in a paid feature.
5. **Credit must survive copies.** CC BY-SA requires credit to carry through. "Copied from" must keep the original's title and creator name even if the original is later deleted. When a copy is submitted to the library, the admin must see that it is a copy and how much was changed.
6. **"No under 18" (8) needs to know age, and the app does not store it.** **PROPOSAL:** a one-time "I am 18 or older" confirmation before the first submit and before accepting an edit invite on a public deck. A self-declaration can be false; it records that the person said so. Separately, the DPDP Act 2023 treats everyone under 18 as a child and requires verifiable parental consent to process their data at all. That is bigger than publishing, is already on the audit's deferred list (`docs/AUDIT-2026-10.md`), and needs legal advice (UNVERIFIED: not checked with a lawyer).
7. **Edit sharing (7) needs a safe shape.** An edit link that leaks lets anyone change the deck. **PROPOSAL:** view-only sharing works by link and with named people. Edit access goes only to a named EduSarthi account (by email), and that person must accept it. Only the owner can publish, withdraw, delete, change sharing or invite. On a public deck, editors' changes follow the same small-fix and big-edit rules.
8. **Following (3) has side effects.**
   - When the author deletes a card, followers lose their progress on that card (`CardState` is deleted with the card).
   - When the deck leaves the library, followers lose access. That holds for a takedown and for a deck its author withdraws (decision 13).
   - Copies made before this change stay copies.
9. **Nothing has been tested live (1).** Every phase below adds to code that has never run against the real Supabase bucket or SendGrid. Test first, so that when something fails we know whether the old code or the new code caused it.

## Plan

Every phase works the same way:

1. Build it on its own branch.
2. Open a pull request and let CI pass.
3. Merge.
4. If the schema changed, run **Actions → Database setup**.
5. Test it on the live site.

Every schema change listed is **additive** (new nullable columns or new tables), so no existing data is lost. One migration per step. Each phase touches more than 6 files, so its file list is shown for approval before building.

### Phase 0 — Live test on Vercel (no new code)

- Check that `main` has everything, run **Actions → Database setup**, and confirm the Vercel variables (Supabase, `AUTH_SECRET`, SendGrid, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`). Steps: `LIVE-TESTING-GUIDE.md`.
- Run the full round from `docs/flashcard-library-plan.md` → "Next step":
  - **Student deck:** make a deck → submit → admin approves → it shows in the library → copy it.
  - **Teacher deck:** verify the teacher → deck with a video → a learner records → the teacher audits.
  - **Institute:** apply → approve → join with the code → a teacher shares a deck → a student copies it.
- Fix what breaks, one thing at a time. Phase 1 starts only after this round passes.

### Phase 1 — Publishing terms: age, public name, licence, rules

**Status (27 Oct 2026): BUILT on branch `claude/sweet-davinci-d313f6`. Not merged; it waits for the Phase 0 live test.** Type check and production build pass. A browser test on a local copy passed 15 of 15 checks:
- the form, the 18+ refusal, the missing-tick refusal, a phone number in a display name refused;
- what is saved;
- the second deck doesn't ask about age again;
- the server refuses a submit with no consent, and a first-time "under 18";
- the admin checklist and consent record;
- the credit line in the library, on the deck page and on Explore;
- an older deck shows no credit;
- Settings changes the name everywhere at once;
- the admin clears a display name;
- the rules page and Terms open signed out.

Defaults taken when the owner answered "yes" without picking (PROVISIONAL, easy to change):
- EduSarthi's own decks are © EduSarthi, not CC BY-SA.
- A display name goes live at once, and the admin can clear it (Admin → Users → Clear).
- The age check is a tick, not a date of birth.
- Teachers get the same name choice as students; "no name" shows "an EduSarthi teacher".

Files beyond the approved list:
- `components/decks/DeckCredit.tsx`: the shared credit line.
- `app/api/admin/users/route.ts` and `app/(admin)/admin/users/page.tsx`: the Clear button. The page is now 251 lines; split the row actions into a component when it next changes.
- `lib/xlsxImport.ts`: admin imports get © EduSarthi.

**After merging:**
1. Run Actions → Database setup (new columns only).
2. Run Actions → Load flashcard decks, so the 21 subject decks get the © EduSarthi label.
3. The owner decides how to tell account holders about the new Terms section; the Terms promise an email before a significant change.
4. A lawyer reviews the Terms, the library rules and the licence wording.

Before more decks go public, every public deck needs the creator's consent on record.

- **Age check:** a one-time "I am 18 or older" before the first submit. Someone who says no sees: "Publishing to the public library is open from age 18. You can still keep this deck private or share it by link."
- **Public name:** chosen at the first submit and changeable in Settings. The choices are:
  - full name
  - first name only
  - a display name they type
  - no name ("an EduSarthi learner")

  The choice applies to all their public decks at once. The admin checks a typed display name together with the deck.
- **Licence and EduSarthi's permission:** three tick boxes at submit:
  - "I made this, or I have the right to share it."
  - "It will be public under CC BY-SA 4.0."
  - "EduSarthi may use it in paid features."

  All three are saved on the deck with the date and the terms version.
- **Library rules page** (`/legal/library-rules`) says what gets rejected: textbooks or guides copied without permission, wrong answers, personal details, hateful or sexual content, AI cards nobody checked, and ads. It is linked from the submit panel and the report button. The Terms page gets a clause on the content licence.
- **Admin review checklist** on `/admin/decks/[id]`, built from those rules.
- **Credit shown** on the library deck page, Explore and the share page: "by <name> · CC BY-SA 4.0".
- Schema (additive): `User.adultConfirmedAt`, `User.publicName`, `User.creditStyle`; `Deck.licence`, `Deck.termsVersion`, `Deck.termsAcceptedAt`.

### Phase 2 — "Copied from" and Follow

**Status (27 Oct 2026): BUILT on branch `claude/sweet-davinci-d313f6`. Not merged; it waits for the Phase 0 live test, like Phase 1.** Type check and production build pass.

A local browser test passed 12 of 12 checks:
- following opens the study page on the original's cards, and Known is saved as the learner's own progress;
- the deck appears under My decks → Following;
- the author's fix reaches the follower once approved (blocked while in review);
- "Make my own copy" records "Copied from <title> by <name>", with a link;
- the admin sees "This deck is a copy" with "0 of 3 cards changed";
- a copy of an EduSarthi deck is refused for both publishing and a share link;
- a non-follower cannot mark the deck's cards;
- unfollow works;
- followers lose a withdrawn deck;
- the 50-follow limit holds.

The Phase 1 test still passes 15 of 15, and institute and share-link copies still work and record their source.

Owner's answers ("yes" to the recommendations):
- copies of EduSarthi decks can't be published or link-shared;
- the follow limit is 50, separate from the 20-deck limit;
- copying moved to `lib/deckCopy.ts`, which brought `lib/decks.ts` from 290 to about 233 lines.

Built as: `lib/deckFollow.ts`, `lib/deckCopy.ts`, `components/decks/FollowButton.tsx`, `/library/[id]/study`, a Following section in My decks, "Follow and study" on Explore and the library deck page, and the "Copied from" line on the library, deck editor and share pages. Beyond the list: `components/decks/CopyDeckButton.tsx` got an outline style for "Make my own copy".

The interim gap (an edit hid the deck from followers until it was re-approved) is closed by Phase 3. Copies made before Phase 2 have no link to their original.

**After merging:** run Actions → Database setup (new columns and the DeckFollow table only).

- `Deck.sourceDeckId` (nullable; cleared if the original is deleted) and `Deck.sourceCredit`, a saved line with the original's title and creator name, so the credit survives.
- The copy and its library page show "Copied from <title> by <name>". When a copy is submitted, the admin sees the original next to it and how many cards changed.
- **Follow:** a new `DeckFollow` table. In the library and on Explore:
  - "Follow and study" is the main button.
  - "Make my own copy" is the second.

  My decks gets a "Following" section. Studying uses the original cards with the learner's own progress (`CardState` is per person and card, so this needs no copy).
  - **PROPOSAL:** follows do not count toward the 20-deck limit; the cap is 50 follows per person.
- Learner recordings on a verified teacher's deck work for followers too: they study the original, so the recording reaches that teacher. Copies still cannot be sent for audit.
- Schema (additive): `Deck.sourceDeckId`, `Deck.sourceCredit`; new table `DeckFollow`.

### Phase 3 — Small fixes go live; big edits become a reviewed version

**Status (27 Oct 2026): BUILT on branch `claude/sweet-davinci-d313f6`. Not merged; it waits for the Phase 0 live test.** Design and the differences from it: `docs/PHASE3-DESIGN.md`. Type check and production build pass.

A local browser test passed 15 of 15 checks:
- on a live deck: no Add, no Delete, details locked, "Start a new version" shown;
- a small fix goes live and is logged;
- a second fix to the same card that day is refused, and so is a change over 30 characters (with the new-version hint);
- add, delete and rename on a live deck are refused;
- the admin's Undo restores the text, emails the creator and shows a note on the deck;
- a new version shows its banner, stays out of My decks, and the live deck shows "new version in progress";
- small fixes pause while a version exists;
- while a version waits, the library is unchanged and followers keep studying;
- the admin sees "1 card added · 1 changed · 1 removed";
- approving updates the same live deck, keeping follower progress and the shared picture;
- discard and reject both leave the live deck untouched.

A further check showed that a picture is kept while the live deck uses it and deleted after a version removes it. The Phase 1 (15 of 15) and Phase 2 (12 of 12) tests still pass; one Phase 2 check was updated, because a small fix now reaches followers at once.

**After merging:** run Actions → Database setup. It adds `Deck.draftOfId`, `Word.liveWordId` and the `DeckChange` table, and pushes without Prisma's data-loss warning.

- **Small fix (decision 10)**, all of these must hold:
  - It only changes the text of existing cards (front, back, example, notes).
  - It changes at most 30 characters in each field.
  - The card has not had a small fix yet that day.
  - At most 10 cards in the deck have had a small fix that day.

  Anything else is a **big edit**: a new or deleted card, a picture, audio or video change, the title, tags or description, or a bigger text change.
- **Small fix:** it goes live at once and is logged, before and after, in a new `DeckChange` table. The admin's "Fixes to check" list has Accept and Undo. A fix over the daily limits counts as a big edit.
- **Big edit:** saved as a draft version in a new `DeckRevision` table, while the approved version stays in the library.
  - Approved: the edit is applied to the same cards, so followers keep their progress.
  - Rejected: the owner sees the reason and the live version stays as it was.
- This replaces `sendBackIfPublished` in `lib/deckReview.ts`.
- This is the largest phase. A short design note comes first, for approval: how a draft version holds new cards and new pictures or audio before it is approved.

### Phase 4 — Share with people: view and edit

**Status (27 Oct 2026): BUILT on branch `claude/sweet-davinci-d313f6`. Not merged; it waits for the Phase 0 live test.** Type check and production build pass.

The owner said "yes" to the file list and the recommendations:
- invited people get an email, capped at 20 invites per person per IST day;
- people can be invited before they have an account (the invite waits on their email, and the app never says whether an email has an account);
- editors of a published deck must accept the library terms, and the owner can't submit until every editor has;
- viewers can study with their own progress, and can copy;
- only the owner starts or submits a new version (editors work inside it).

How it is built:
- `DeckMember` table (email, user once accepted, View/Edit, terms acceptance) and `Word.updatedAt` (with a default, so it pushes without a warning).
- `lib/deckAccess.ts`: owner, editor or viewer, with the permission inside the query. A working copy is shared with the live deck's editors only.
- `lib/deckMembers.ts`, the `/api/decks/members` route, and the screens: **People** on the deck (owner), **Invitations** at the top of My decks, **Shared with me**, and `/decks/[id]/shared` for viewers.
- **Cards an editor adds belong to the deck's owner.** All owner-scoped queries keep working, and an editor's account deletion never removes files from someone else's deck.
- **A save over someone else's newer change is refused** with "Someone changed this card after you opened it".
- **On a private deck,** editors see a non-blocking request to accept the terms. Without it the owner could never submit.
- The public credit reads "by <owner> with <editors who accepted the terms and chose a name>".

A local browser test passed 14 of 14 checks:
- invites by email (also an address with no account) and the invite email;
- accepting, and an editor's card belonging to the owner;
- no owner-only sections for editors;
- a viewer reads and studies but cannot edit, and can copy;
- the overwrite check;
- the owner is blocked until the editor accepts the terms;
- a new editor of a public deck must tick 18+ and the terms;
- admin sees the editors, and the library credits "with Ravi S.";
- the 10-people limit; remove; leave.

Extra checks: the 21st invitation in a day is refused, and an editor works inside the owner's new version but cannot start or submit it. Regressions still pass: Phase 1 15 of 15, Phase 2 12 of 12, Phase 3 15 of 15.

Beyond the list: `components/decks/EditorTerms.tsx` (the editor's terms box), `components/decks/VersionPanel.tsx` (owner-only Start and Discard) and `components/decks/CopyDeckButton.tsx` ("copy a shared deck").

**After merging:** run Actions → Database setup (the DeckMember table and `Word.updatedAt`). Invitation emails need `SENDGRID_API_KEY` and `NEXT_PUBLIC_APP_URL`; without them the invite still waits in My decks.

Not built: due counts for shared decks in My decks (they show on the study page); a phone-only account (no email) cannot be invited.

- A new `DeckMember` table: the deck, the person, VIEW or EDIT, who invited them and when they accepted. The owner invites by the person's account email; the person accepts in My decks → "Shared with me". The share link stays view-only.
- **Editors** can add, edit and delete cards, and edit the title and description. **Only the owner** can publish, withdraw, delete the deck, change sharing or invite.
- **PROPOSAL:** at most 10 people per deck.
- On a public deck, an editor must have done the Phase 1 age check and accepted the terms. Their name shows as "with <name>", following their own credit choice.
- Two technical points:
  - Today, deleting an account deletes the pictures and audio of every card that person made (`app/api/me/route.ts`). An editor deleting their account must not delete files in someone else's deck.
  - Add `Word.updatedAt`, so that when two people edit the same card the second one is warned "this card changed since you opened it" instead of silently overwriting it.
- Removing an editor keeps the cards they added.

### Phase 5 — Institutes in the public library, with their logo

- Decision 9: an institute may submit a deck to the public library under its name and logo. It goes through the same admin review as every deck. Today an institute deck cannot be published while it is shared inside the institute (`lib/deckReview.ts`); that rule changes.
- Who may submit for an institute: its admin and its teachers (PROPOSAL, matching who can share inside the institute today).
- New `Institute.logoKey`: PNG, JPG or WebP up to 1 MB, uploaded by the institute's admin. The site admin approves it, because a logo is shown to the public.
- The library shows the institute's logo and name, and the teacher's name if they chose to show it.

### Phase 6 — Tell people and update the docs

- A lawyer reviews the Terms, the privacy page and the new library rules before the library is advertised.
- The owner decides how existing account holders are told. The privacy page promises an email before a change takes effect.
- Update `docs/flashcard-library-plan.md` and `docs/PROJECT-MEMORY.md` after every phase.

## Open questions for the owner

The seven questions of the first round were answered on 27 Oct (decisions 9–15). Still open:

- **Age check:** a "I am 18 or older" tick or the date of birth? Not answered; the build uses the tick unless the owner says otherwise.
- **Creator rewards:** the revenue share percentage, payouts (and the identity and tax details they need), how many free AI cards, and which badges. These are decided with the paid plans and do not block this plan. The Terms written in Phase 1 only say that creators may be rewarded.

## Not in this plan

Comments and ratings on decks, trusted creators skipping review (ruled out by decision 6), student Excel/CSV import and export, the in-app notification bell (already in the backlog), and the paid plans themselves.
