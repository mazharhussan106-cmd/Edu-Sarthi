# Flashcard Library — plan

Status: **Phases 1–4 are built and pushed. Phase 5 (Institute) is not built — it waits until after the first public release.**

Before any of it works on the live site, run GitHub → Actions → **Database setup** → Run workflow. It adds the new tables and columns (all additive, no data is removed).

## Goal

Turn the existing student flashcards into a shared, repository-style library:
anyone signed in can make decks, keep them private, share them by link, or
publish them to a public library after an admin approves them. Everyone
revises cards with the spaced-repetition ladder that already exists.

## Decisions already made

| Topic | Decision |
|---|---|
| Where it lives | Inside Edusarthi, extending the current flashcard code. Not a new system. |
| Sharing | Private by default · view-only share by link · public library. No "can edit" sharing. |
| Public review | **Every** deck going public is reviewed by an admin first. Private and link-shared decks are never reviewed. |
| Admin | The owner (Mazhar) is the main admin. |
| Teacher decks | A teacher's deck can have video and audio plus the audit section, and an admin verifies it before it is published. |
| Student decks | Text (front/back), images, audio (pronunciation/speaking), Markdown/code. **No** video or audit section. |
| Video | Embedded from a YouTube/Drive link. Not uploaded. |
| Audio / images | Uploaded to Supabase Storage with size limits. |
| Revision | Keep the current ladder (Day 1·3·7·15·30·60) and Known/Unknown + Hard/Medium/Easy. SM-2 is a possible later step, not part of this work. |
| Institute | Planned, **not built** until after publish. Phase 1 only leaves a nullable column for it. |
| Licence / credit | Undecided — decide later. Library pages show no owner name until then. |

## What exists today (so we extend, not rebuild)

- `Word` — global card, imported from the 56-column sheet. No owner, no deck.
  `details` Json holds the sheet fields; `imageUrl`, `audioUrl`, `videoUrl` exist.
- `CardState` — one student's progress on one card (`known`, `recall`, `stage`,
  `dueAt`, remarks, note). Unique on `(userId, wordId)`.
- `lib/srs.ts` — the ladder. `app/api/flashcards/route.ts` — student writes.
- `Role` already has `STUDENT`, `TEACHER`, `ADMIN`; the admin console and
  `AdminLog` exist.
- UI: `components/flashcards/*`, `app/(student)/flashcards/page.tsx`.

## Phases

### Phase 1 — Decks and ownership — DONE

- `Deck` model (owner, title, description, tags, visibility, share token, review status, reject reason, `instituteId` reserved and unused) and nullable `Word.deckId` / `Word.ownerId`.
- Built-in cards keep `deckId = null`, so every student's existing progress is untouched.

### Phase 2 — Make your own deck — DONE

- My decks (`/decks`): create, rename, delete; limits of 20 decks per user and 500 cards per deck.
- Cards: front, back, example, Markdown notes, picture (2 MB), audio record or upload (60 s). Media uploads on Save; files are cleaned up on card, deck and account delete.
- Study your own decks on the existing Day 1·3·7·15·30·60 ladder.
- Share by link (`/d/<token>`): view-only, works signed out, revocable; "Copy to my decks" makes a private copy (files are copied too).
- Fixed: the built-in session, search, practice page and teacher dossier no longer see student-made cards.

### Phase 3 — Public library and admin review — DONE

- Submit a deck (minimum 3 cards). It waits in the admin queue; nothing is public until approved.
- Admin review page (`/admin/decks`): read every card, approve, or reject with a reason the owner sees. Every decision is logged.
- Library (`/library`): search, tags, copy to my decks.
- Report button. Three open reports pull a deck back to review on their own; admin can dismiss or take it down (link stops, reason shown to owner).
- Editing a published deck sends it back to review.

### Phase 4 — Teacher decks — DONE

- Teachers and admins get two extra card sections: a video link (YouTube or Google Drive only, stored as our own rebuilt embed address) and a Teacher's guide ("what to listen for"). Students never see these fields, and a student editing a copied teacher card cannot erase them.
- Admin verifies a teacher (Users page, with a reason). An unverified teacher can build decks but cannot publish. Changing the role clears verification.
- "Verified teacher" badge in the library.
- Decks live in the shared shell, so teachers keep teacher navigation.

### Added after Phase 4 — DONE

- Likes (one per person) and sorting: Newest, Most liked, Most copied.
- The owner is emailed when a deck is approved, rejected or taken down (needs `SENDGRID_API_KEY` in production); status badges on My decks.
- Admin overview tile: decks to review and reported.
- Learner recordings on a verified teacher's published deck: the student records on a card, the recording goes only to that deck's teacher (`Submission.assignedTeacherId`), who audits it with the usual rubric. The teacher's deck page shows waiting and audited counts.

### Phase 5 — Institute — NOT BUILT (plan only, decisions recorded)

Owner decided to live-test Phases 1–4 first; Institute starts after that.

Decisions already made:

| Topic | Decision |
|---|---|
| Who creates one | Anyone can **apply**; the site admin approves. Needs an apply form and an approval queue in the admin console. |
| Institute roles | An institute has its own admin and teachers, limited to that institute. |
| Decks | Institute decks are visible **only to its members**. They do not go to the public library and need no public admin review. |
| Students joining | By an **invite link / join code** given by the institute admin. The admin can remove a member. |

Still to decide when we start: whether an applying institute needs documents or just a name and contact; whether a teacher can belong to more than one institute; how an institute is suspended; and whether members' recordings go to the institute's teachers only.

Planned shape (not final): `Institute` (name, status PENDING / APPROVED / SUSPENDED, join code), `InstituteMember` (user, institute, role ADMIN / TEACHER / STUDENT), and the already-reserved `Deck.instituteId`. Institute pages live under their own route group and check membership on every query, the same way decks check ownership today.

## Known gaps and things to watch

- If a deck's teacher is suspended or demoted, recordings already assigned to them stay assigned; an admin reassigns them from Dispatch.
- Abandoned uploads can leave orphan files in the bucket; a cleanup job is not built.
- No in-app notifications (email and the status on My decks only); no per-card remarks (⭐❤️❓) in own decks; no search inside a deck.
- None of the new screens have been opened in a browser or against the real Supabase bucket and SendGrid yet — do a full round by hand before announcing it.
- Licence and credit for public decks are undecided; add a `LICENSE` file and a content policy before calling the library open source.

## Risks

- **Moderation.** Public user content invites abuse; hence review-before-public
  plus a report button from day one.
- **Storage cost** grows with uploads; limits above, and link-only video.
- **Embeds.** YouTube/Drive links are validated against an allow-list of hosts;
  never rendered as arbitrary HTML.
- **Markdown/code.** Rendered with sanitisation; no raw HTML.
- **Open source.** Needs a `LICENSE` file and a content policy before the
  library is advertised as open. Left undecided on purpose.

## Working rules (from CLAUDE.md)

- One migration per step; say what data could be lost before each.
- More than 6 files → give the file list and get approval first.
- Colours via tokens only; every file gets a header comment; files under
  ~250 lines; `export const revalidate = 0` on user-specific pages.
- Not part of this plan unless asked: likes, comments, follow, comments on
  decks, SM-2.

## Next step

Run Database setup, test a full round on the live site (student deck → submit → admin approve → library → copy; teacher verify → deck with video → learner records → teacher audits), then decide the licence. Phase 5 after that.
