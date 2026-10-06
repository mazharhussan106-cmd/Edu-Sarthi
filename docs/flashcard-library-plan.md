# Flashcard Library — plan

Status: **plan only, nothing built yet.** Approve phase by phase.

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
| Licence / credit | Undecided — decide later. No licence field in Phase 1. |

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

Each phase is one migration at most and is tested locally before pushing.

### Phase 1 — Decks and ownership (schema)

- New `Deck`: `id`, `ownerId`, `title`, `description`, `tags`,
  `visibility` (`PRIVATE` | `LINK` | `PUBLIC`), `shareToken` (unique, nullable),
  `status` (`DRAFT` | `PENDING_REVIEW` | `APPROVED` | `REJECTED`),
  `rejectReason`, `reviewedById`, `reviewedAt`, `instituteId` (nullable,
  unused for now), timestamps.
- `Word` gets nullable `deckId` and `ownerId`.
- **Data loss:** none. The migration only adds tables and nullable columns.
  Existing cards keep `deckId = null` and are treated as the official built-in
  deck, so every student's current progress is untouched.
- A user reads a deck only if they own it, hold its share link, or it is
  `PUBLIC` + `APPROVED`. Every query is scoped by the current user.

### Phase 2 — Make your own deck (student)

- "My decks" page: create, rename, delete a deck.
- Card editor: front, back, optional image, optional audio recording,
  Markdown/code in the body. Shared Zod schema client and server.
- Private by default. "Share by link" generates a `shareToken`; viewers of the
  link get a read-only deck and a "Copy to my decks" button.
- Revision of own and copied decks reuses `CardState` and the ladder.
- Limits: image ≈ 2 MB, audio ≈ 60 s. Loading states everywhere; built for slow phones.

### Phase 3 — Public library and admin review

- "Make public" moves the deck to `PENDING_REVIEW`.
- Admin console gets a review queue (alongside `content`): preview the deck,
  approve, or reject with a reason the owner can read.
- Every approve/reject writes an `AdminLog` row.
- Library page: browse, search, tag filter, copy to my decks, **report** button
  (reports go to the same admin queue). Like counts come later, not now.
- Editing an approved public deck sends it back to `PENDING_REVIEW`, or the
  review would be meaningless.

### Phase 4 — Teacher decks (video, audio, audit section)

- Teachers get the extra card sections: video (YouTube/Drive link, embed
  only), audio upload, audit section.
- Admin verifies a teacher before their decks can be published; a teacher deck
  still goes through the Phase 3 queue.
- Student cards never show these sections.

### Phase 5 — Institute (plan only, do **not** build yet)

- Separate Institute area with its own admin and teachers, limited to that
  institute. Will use `Deck.instituteId` and a new `Institute` model.
- Built after the first public release.

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

Approve Phase 1. I will list the exact files and the migration, then build it.
