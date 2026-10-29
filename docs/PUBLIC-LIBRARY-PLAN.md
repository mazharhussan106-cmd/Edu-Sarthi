# Public library hub — plan (29 Oct 2026)

Status: **PLANNED. Nothing is built.** Branch for the plan: `claude/bold-hopper-hxfrpd`. Needs the owner's "go" for Step 1 (it touches more than 6 files, so CLAUDE.md asks for approval first).

## Requirement (owner, 29 Oct 2026)

EduSarthi is meant to work like a repository: anyone can make a flashcard deck. There must be **one place** where anyone can see every publicly available deck, and where people go to search for them.

Answered by the owner in the same chat: "public" means everyone, signed in or not. The domain (`edusarthi.com` is not connected to Vercel yet, see `PROJECT-MEMORY.md`, "Fix: Google sign-in landing in a guest") is **not** a blocker: the plan reads the address from `NEXT_PUBLIC_APP_URL`, so it works on whichever address is live.

## What is public today (checked in `proxy.ts`, 29 Oct)

| Page | Signed out | Search engines |
|---|---|---|
| `/`, `/about`, `/support`, `/legal/*`, auth pages | open | can index (no robots.txt, no sitemap, no share image) |
| `/d/<token>` (link-shared deck) | open, whole deck | `noindex` already |
| `/library`, `/library/<id>`, `/library/<id>/card/<id>` | **redirected to /login** | cannot see it |
| `/explore`, study and practice pages | redirected to /login | cannot see it |

So the approved, CC BY-SA decks (the 21 EduSarthi subject decks and anything students publish) sit behind a login. Nobody outside can find them.

## Proposal: the Library is that place

No new section. Open the existing `/library` to everyone, at the same URLs, so signed-in people keep their navigation and signed-out people get a plain public header with "Sign in". The library pages were already written to cope with no session (`session?.user?.id`), and `FollowButton` and `CopyDeckButton` already have a signed-out mode that links to /login.

Who sees what (**PROPOSAL**, not yet approved):

- **Everyone:** the library list, search, tags, a deck page with all its cards, each card, the creator's credit and licence.
- **Needs an account:** follow, copy, like, report, study, record for a teacher. Each shows "Sign in to …" instead of failing.
- Only listed decks (`LISTED` in `lib/decks.ts`) ever show: approved by an admin, owner and institute not suspended. A deck that is withdrawn or taken down disappears at once, and from the sitemap.
- Creators' names show **as each creator chose** (full name, first name, display name or none). Only people 18 or older can publish, which limits the risk. The email in Step 4 tells them it now means the whole internet and points to Settings → "How your name shows on public decks".

## Build steps (one at a time, none needs a database change)

**Step 1 — open the doors (7 files).**
1. `proxy.ts`: make exactly `/library`, `/library/<id>` and `/library/<id>/card/<id>` public, with a pattern, **not** the prefix `/library`. A prefix would also open `/library/<id>/study` and `/library/<id>/practice/<id>`, which assume a signed-in student.
2. `components/layout/PublicHeader.tsx` (new): the header now inside `app/(public)/layout.tsx`, plus a "Library" link, so both layouts share it.
3. `app/(public)/layout.tsx`: use it.
4. `app/(shared)/layout.tsx`: no session → public header and footer, no student navigation, no `ensureActiveUser()`.
5. `components/decks/LikeButton.tsx` and 6. `components/decks/ReportButton.tsx`: a `signedIn` prop that shows a sign-in link, as `FollowButton` does.
7. `app/(shared)/library/[id]/page.tsx`: pass `signedIn` to the buttons.

**Step 2 — make it findable (6 files).** `app/robots.ts`, `app/sitemap.ts` (home, about, library, every listed deck with its last change), `metadataBase` and share defaults in `app/layout.tsx`, `generateMetadata` on the deck page, card pages `noindex, follow` (hundreds of thin pages), and a "Browse the library" button on the landing page. Read `node_modules/next/dist/docs/` for the metadata and sitemap conventions first (CLAUDE.md: this is not the Next.js you know).

**Step 3 — browsing for strangers (3 files).** Today the list stops at 30 decks with no next page, and tags can only be used if you already know them. Add paging, a row of the tags in use (with counts), and wording that fits a visitor. `app/(shared)/library/page.tsx`, `lib/libraryTags.ts`, one small component.

**Step 4 — words and notice (before anything goes live).** The Privacy page says public decks are "visible to every signed-in user" (`app/(public)/legal/privacy/page.tsx`, line ~188), and creators agreed to the terms of `LIBRARY_TERMS_VERSION = "2026-10-27"`. Opening the library to everyone changes that.
- Update Privacy, Terms and Library rules to say anyone, including search engines, can see published decks.
- Bump `LIBRARY_TERMS_VERSION`; decide whether existing decks need the creator to accept again. **Owner and lawyer** (`docs/LEGAL-REVIEW-PACK.md`).
- The owner sends the announcement (Admin → Announcements) and waits a few days.

**Order matters:** only pushes to `main` deploy, so Steps 1 to 3 can be built and tested on the branch, and merged only after Step 4's text is ready and the email is out. Do not merge Step 1 alone.

## Traps to remember

- The proxy prefix trap above.
- Institute logos are signed URLs that expire. They are decorative (`alt=""`), so an old cached page shows no logo rather than a broken one. Do not add the logo to share images.
- Crawlers hit the database. The pool is one connection (`connection_limit=1`) and library pages use `revalidate = 0`. Watch Vercel runtime errors after launch; cache the sitemap for an hour.
- `/d/<token>` stays `noindex`: a link-shared private deck must never reach search.
- `/explore` stays a student page (import and study). The public hub is the Library.

## Tests for each step

Local Postgres and Playwright, signed out and signed in:
- `/library`, a deck and a card answer 200 with no redirect;
- `/library/<id>/study` and `/practice/…` still go to /login;
- like, follow, copy and report show a sign-in link;
- a taken-down deck is a 404 and leaves the sitemap;
- `/d/<token>` still has `noindex`;
- robots and sitemap output;
- axe on the signed-out pages in all five themes;
- `tsc` and `next build`.

## Not in scope, on purpose

- Public pages for the 2,227 built-in words (they are part of what a paid plan may offer).
- A limit on how many cards a signed-out visitor sees. Easy to add later if the owner wants one.
- Indexing individual card pages.

## Open

- Terms version and re-consent (Step 4): the owner and a lawyer.
- The owner's "go" for Step 1.
