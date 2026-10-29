# Public library hub — plan (29 Oct 2026)

Status: **Steps 1 to 4 built and tested on `claude/bold-hopper-hxfrpd` (29 Oct), not merged. What is left is the owner's: the lawyer's answer on re-consent, sending the announcement, and a 7-day wait (see Step 4).** Do not merge before that. Step 1a (commit "Nav: Library replaces Class …") is safe to merge alone. Steps 2 and 3 are harmless until Step 1b is live, because a crawler cannot reach the library while it is behind login, but keep them together (Step 3 also changes what signed-in learners see: pages, topic chips, a new heading).

## What Step 1 did, and how it was tested

Built exactly as listed under Step 1a and 1b below, plus two small things the tests found:
- the new "Sign in" link in the library's intro is underlined (a link inside a sentence must not differ by colour alone);
- the card page has a visually hidden `<h1>` (it had none; a visitor from outside now lands on it).

Tested on a production build, a local Postgres and Playwright (56 checks in a throwaway script, plus the Profile suites p1 and p4, 62 checks, as a regression run):
- phone bar and computer header: Dashboard, Flashcard, Audited, Library, Profile; Library lit on the list and on a deck; footer link row starts with Library;
- the menu has the same nine groups; "Main pages" shows Library, not Class; "Shared and library decks" still has its Library row; the Settings gear still links to `/settings`;
- `/class` still opens (200); teacher header has no Library and no Class;
- a visitor: `/library`, a deck and a card answer 200 with the public header and no student bar; only listed decks show (a pending, a private and a link-shared deck do not); search works; the deck page has one sign-in button plus a like and a report link; `/library/<id>/study`, `/practice/…`, `/explore`, `/decks` and `/dashboard` still go to /login; `/d/<token>` is still `noindex`;
- a signed-in person who is not the owner still gets the real Follow, copy, like and report controls; the owner sees no Report on their own deck;
- a rejected deck leaves the list and shows the not-found page with `noindex` and no cards (status 200, by design: `app/(shared)/loading.tsx` streams first, as Next 16 documents); approving it again brings it back;
- axe (WCAG 2.1 AA and best practice) on the library list, a hand-made deck, an imported deck and a card, signed out, in all five themes: clean, apart from the logotype's contrast that every page has;
- `tsc --noEmit` and `next build` pass.

Not tested: a real phone, the live database, an unverified signed-in account (the code path is unchanged), and whether Vercel's Hobby limits notice crawler traffic (Step 2).

## Owner's instruction for Step 1 (29 Oct 2026)

"Remove the Class section and add Library in its place — in the footer and in the website header. Change nothing in the menu or Settings. Make the plan, then start."

How it is read:
- **Footer** = the phone's bottom bar (it shows Dashboard, Flashcard, Audited, Class, Profile). The site footer's link row gets Library too, so a signed-out visitor, who has no bottom bar, can find it.
- **Header** = the computer's header row, which reads the same list as the bottom bar (`STUDENT_LINKS` in `lib/studentNav.ts`), and the signed-out header.
- Class leaves these bars only. `/class` stays as a page: Get started on Profile and the skill scores link to it, and speaking practice is still reached from the menu (Learn and practise → Practice modules) and the dashboard.
- **Menu and Settings are not edited** (`studentMore`, `MobileMenu`, the settings pages). The menu's first group, "Main pages", is a copy of the same five links by design (`MobileMenu` receives `links`), so it shows Library where it showed Class. Nothing else in the menu moves; its own "Library" row under "Shared and library decks" stays.
- Teacher and admin headers are not touched.

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
- Only listed decks (`LISTED` in `lib/decks.ts`) ever show: approved by an admin, owner and institute not suspended. A deck that is withdrawn or taken down disappears at once from the list and shows the not-found page (with `noindex`, HTTP status 200, see above), and leaves the sitemap in Step 2.
- Creators' names show **as each creator chose** (full name, first name, display name or none). Only people 18 or older can publish, which limits the risk. The email in Step 4 tells them it now means the whole internet and points to Settings → "How your name shows on public decks".

## Build steps (one at a time, none needs a database change)

**Step 1a — Library replaces Class in the navigation (own commit, safe to merge alone).**
1. `lib/studentNav.ts`: `{ href: "/class", label: "Class" }` becomes `{ href: "/library", label: "Library" }`, in the same fourth place.
2. `components/layout/BottomNav.tsx`: Library icon for `/library`; the rule that kept Class lit on `/modules` and `/practice` goes (nothing is lit there now, and the bar is hidden inside a practice).
3. `components/layout/Footer.tsx`: Library first in the link row.
4. `docs/FEATURE-MAP.md`: the Class row says it is no longer in the bars.

**Step 1b — open the doors (own commit; hold it back until Step 4 is ready).**
1. `proxy.ts`: make exactly `/library`, `/library/<id>` and `/library/<id>/card/<id>` public **for a signed-out visitor**, with a pattern, **not** the prefix `/library`. A prefix would also open `/library/<id>/study` and `/library/<id>/practice/<id>`, which assume a signed-in student. A signed-in but unverified person is still held at /verify, as before.
2. `components/layout/PublicHeader.tsx` (new): the header now inside `app/(public)/layout.tsx`, plus a "Library" link, so both layouts share it. The landing page has its own header; it gets the link too.
3. `app/(public)/layout.tsx` and `app/page.tsx`: use it / add the link.
4. `app/(shared)/layout.tsx`: no session → public header and footer, no student navigation. (`ensureActiveUser()` already returns quietly with no session.)
5. `components/decks/LikeButton.tsx` and 6. `components/decks/ReportButton.tsx`: a `signedIn` prop that shows a sign-in link, as `FollowButton` does.
7. `app/(shared)/library/[id]/page.tsx` and `app/(shared)/library/page.tsx`: pass `signedIn` to the buttons; hide "My decks" when signed out.

**Step 2 — make it findable. BUILT (29 Oct), 8 files and no database change** (the plan said 6; a shared address helper and the library list's own metadata were added).
- `lib/siteUrl.ts` (new): the site's address for search engines: `NEXT_PUBLIC_APP_URL`, else Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, else localhost outside production, else `null`. It does not throw like `lib/appUrl` does (that one guards email links): a throw would fail `next build` and block every deploy over a missing variable. With `null` there is no canonical tag, no `metadataBase`, no sitemap line in robots.txt and an empty sitemap, and everything else works (tested with a production build and the variable empty).
- `app/robots.ts` (new): allows `/`, disallows `/api/`, the signed-in areas and `/library/*/study` and `/library/*/practice/`. **It does not disallow `/d/`**: those pages say `noindex` themselves, and a crawler that may not fetch a page never sees its `noindex`.
- `app/sitemap.ts` (new): home, library, about, support, legal and every listed deck (`LISTED`, with `updatedAt`). `force-dynamic`, so a taken-down deck leaves at once and `next build` needs no database; it throws if the database is down, so a crawler retries instead of believing a short list. No card pages and no filtered lists. One file holds up to 45,000 decks; split it with `generateSitemaps` past that.
- `app/layout.tsx`: `metadataBase`, `openGraph` with only `siteName`, `type` and `locale`, and `twitter: summary`. **Do not add a title or description to the root `openGraph`:** Next merges metadata shallowly, so every page that sets none would inherit the home page's. Pages need no `openGraph` of their own: Next builds `og:title` and `og:description` from the page's `title` and `description` (checked on About and on decks).
- `app/(shared)/library/page.tsx`: its own title and description, canonical `/library`; a search, a tag or a sort other than Newest is `noindex, follow` (same decks again).
- `app/(shared)/library/[id]/page.tsx`: `generateMetadata` with the title "<deck> — EduSarthi", the deck's own description (cut at 155) or "N flashcards in the EduSarthi library: tags.", and a canonical. **It never names the creator**: titles and descriptions are copied into places the creator never agreed to. Page 2 and on of a long deck are `noindex, follow`. The page and the metadata share one read (`React.cache`), because the live pool has one connection.
- `app/(shared)/library/[id]/card/[cardId]/page.tsx`: `noindex, follow` (hundreds of thin pages), but with its own title "<card> — <deck> — EduSarthi" and a description that names the deck, so a shared card link previews as that card (one shared read here too).
- `app/page.tsx`: a "Browse flashcard decks" button in the hero.
- **Not done, on purpose:** no share image (previews show a title and description only; an image needs a design), no structured data, no Google Search Console setup (the owner does that after launch: add the site, then submit `/sitemap.xml`).
- Next 16 conventions were read first in `node_modules/next/dist/docs/` (robots, sitemap, generate-metadata).

Tested on a production build, local Postgres, plain HTTP and Playwright:
- 45 checks on robots.txt, sitemap.xml (one entry per listed deck, none for a pending, private or link-shared deck, none for a card, a rejected deck leaves at once and returns when approved) and the head tags of the list (plain, search, tag, both sorts), a deck (own and no description, long description, page 2), an imported deck, a card, an unknown card and deck, About, home and the share-link page;
- the same suite with no site address (build and server both started with it empty): 34 checks pass (the sitemap-entry checks do not apply), no 500;
- `siteUrl()` and `canonical()` across six environment combinations;
- the 56 Step 1 browser checks again, and the landing page at 360, 390 and 1280 px (no sideways scroll, three hero buttons, axe clean except the logotype every page has);
- `tsc --noEmit` and `next build` pass.
Not tested: Google actually indexing anything, a real phone, the live database, and how the live pool copes with crawler traffic.

**Step 3 — browsing for strangers. BUILT (29 Oct), 4 files and no database change.** Before it, the list stopped at 30 decks with no next page, and tags could be used only if you already knew one to type.
- `app/(shared)/library/page.tsx`: pages of 24 (`?page=N`, Previous / Next with "page / pages", `rel=prev` and `rel=next`); a count line ("34 decks", "30 decks match", "1 deck matches"); the heading is now "Flashcard library" (it said "Deck library") and the intro and the search placeholder say "topics" where they said "tags", for a visitor who does not know what a deck or a tag is; an empty search offers "see every deck". A page number that is not a number, is 0 or negative, or is past the end shows the nearest real page.
- **Don't undo: the id is the last sort key.** Two decks with the same time or count could otherwise swap places between page 1 and page 2, so one would show twice and another never. Tested with 30 decks that share one `reviewedAt`.
- `lib/libraryTags.ts`: the topics in use and how many listed decks hold each, most used first, ties by name. It counts only `LISTED` decks (a topic held by a pending, private or suspended owner's deck never shows; tested), and a deck counts once per topic. It reads every listed deck's tags and counts in code, since Prisma cannot group an array column and a raw query would repeat the `LISTED` rules where they could drift. Fine for hundreds of decks; at a few thousand, replace it with one SQL aggregate.
- `components/decks/LibraryTags.tsx`: "All topics", then eight chips with counts, then the rest under a native "More topics (N)" fold (no JavaScript; open on load when the chosen topic is one of the folded ones). **Eight, not twelve:** twelve chips took five lines on a phone and pushed the first deck off the screen. A chip keeps the search and sort and drops the page. The chosen one is `aria-current`.
- `lib/libraryUrl.ts`: one `libraryHref()` for every link on the list (sort, topic, pager); it leaves out sort Newest and page 1, so the plain list is always exactly `/library`.
- Metadata: page 2 and on are `noindex, follow` with the canonical still `/library`, like the other variants.
- **Cost to watch:** the list page now runs four reads (count, topics, decks, AI-card counts) where it ran two. The live pool has one connection, so they queue. Watch Vercel's runtime logs after launch; if it is slow, cache the topics.

Tested on a production build and a local Postgres with 34 listed decks (24 + 10) and 15 topics:
- 38 HTTP checks: both pages, no deck twice or missing in the three sorts, the pager links and what they keep, six bad page numbers, topic counts equal the database for four topics, hidden decks' topic never shown, eight chips plus the fold, the fold open for a folded topic, "30 decks match" / "2 decks match" / "1 deck matches" / no match, indexable or `noindex` as above, a rejected deck and a suspended owner changing the counts and coming back;
- 79 browser checks, signed out and signed in, at 390 and 1280 px: clicking a topic, Next, Previous, a search inside a topic, All topics, the fold with the keyboard (Enter opens and closes it), no sideways scroll, no page errors, the bottom bar still lit, and axe in five themes on the list, topic page 2, an open fold, no result and the signed-in list (clean apart from the logotype);
- the Step 1 (56), Step 2 (45) and Profile (62) suites again with the extra decks present; `tsc --noEmit` and `next build` pass.
Not tested: a real phone, the live database and pool, and the list with thousands of decks.

**Step 4 — words and notice (before anything goes live). BUILT (29 Oct), 16 code and wording files and no database change, except the part that is the owner's and a lawyer's.** The Privacy page said public decks were "visible to every signed-in user", and creators had agreed to `LIBRARY_TERMS_VERSION = "2026-10-27"`. Opening the library to everyone changes that.

*Built:*
- **Words.** Privacy (public decks are visible to everyone, with or without an account; search engines may list them and may keep their own copy for a while; link-shared decks are not listed; the creator's name shows to everyone who opens the deck), Terms ("Decks you publish": anyone can read an approved deck, only accounts can follow, copy, like or report, a search engine's copy cannot be deleted by us), Library rules (a new section "Who can read a published deck", and the personal-details rule says the internet can read it). The three pages say "Last updated 29 October 2026". Also corrected where the app said the old thing: the Help answer, Profile → Who sees what (student and teacher), the owner's deck panel once approved ("Anyone signed in can find…"), and the deck-approved email.
- **A fourth required tick on the submit form** (`openWeb`, `lib/deckSchemas.ts`, `components/decks/PublishConsent.tsx`): "Once it is approved, anyone can read this deck, with or without an account, and search engines may list it", with how to undo it. The server refuses a submission without it (400, "Tick that you understand anyone can read a published deck…"). The editor's tick (`EditorTerms`, `InviteList`) says it too.
- **`LIBRARY_TERMS_VERSION` is `2026-10-29`.** It is stamped when a deck is submitted (and copied to the live deck when a new version is approved), so a deck submitted earlier keeps `2026-10-27`: the record of who agreed to what.
- **The announcement.** Admin → Announcements offers a second prepared draft, "EduSarthi: the deck library will be open to everyone" (email text and the dashboard notice), after the Terms update draft (`libraryOpenDraft` and `nextDraft` in `lib/announcements.ts`). After you save the first, the form shows the second. It says the change starts **no earlier than 7 days after the last email is sent**: that is a promise, so keep it. The email goes to every account holder, because the tool has no narrower audience; its first lines let a reader who never published stop.

*Not built, and not the assistant's call (`docs/LEGAL-REVIEW-PACK.md` section 4b, issues 12 to 15):*
- **Do creators who submitted under 2026-10-27 have to accept again?** What is built is option A: notice, seven days, and two instant choices (withdraw a deck, change the name shown). Option B holds each old deck back from visitors until its creator accepts; option C shows visitors "an EduSarthi learner" instead of the chosen name until then. B and C each need a small "accept the new terms" step and a version check where decks are listed; they are not built, and nothing in the code forces re-acceptance.
- Whether a lawyer wants the name choice restated on the submit form, next to the name, and not only in the new tick.

Tested on a production build and, for photos, a dev server, with a local Postgres:
- 29 checks in a browser and over HTTP: the new wording on the three legal pages (and the old sentence gone), Help, student and teacher Profile → Who sees what; the server refusing a submission with the tick missing or false, and the deck staying private; the form showing the tick unticked beside the paid-use tick, refusing without it with a message that says what to tick, then accepting with all four and stamping the deck `PENDING_REVIEW` with terms `2026-10-29`; the owner's deck panel after approval; Admin → Announcements offering the Terms draft, then (after saving) the library one, then a blank form, nothing sent;
- the new draft against the announcement form's own schema (lengths, links, the 7 days) and the order logic in six cases;
- the approval email, read from the dev server's log after an admin approved a deck;
- the Step 1 (56), Step 2 (45), Step 3 (38 and 79) suites and Profile p1, p4, p5, p6 (101) again, all passing; `tsc --noEmit` and `next build` pass. (p5 and p6 store photos on disk, which the app allows only outside production, so they need `npm run dev`.)
Not tested: the email to real recipients (no SendGrid key here), a real phone, the live database.

*What the owner does, in this order:*
1. Decide (with a lawyer) whether option A is enough for decks submitted before 29 Oct; say so and the assistant builds B or C if not.
2. Check that `SENDGRID_API_KEY`, `NEXT_PUBLIC_APP_URL` and `CRON_SECRET` are set in Vercel.
3. **Send the announcement before merging.** Admin → Announcements: email yourself a test, then Start (type SEND). The daily job sends at most 80 a day, so with many accounts it takes several days; Admin → Announcements shows how many are left. Its links (`/legal/terms`, `/legal/privacy`, `/legal/library-rules`) work today and will show the new wording once the branch is merged.
4. **Wait 7 days after the last email, then merge the branch once.** The legal pages with the new wording and the open library then arrive together, as the email promised. (Step 1a alone, Library in place of Class in the bars, is safe to merge earlier, but that is a separate commit on this branch, so ask the assistant to split it out.)
5. After merging: submit a test deck once to see the new form, follow `LIVE-TESTING-GUIDE.md` 4f, then add the site to Google Search Console and submit `/sitemap.xml`.

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
- a taken-down deck shows the not-found page with `noindex` and leaves the sitemap;
- `/d/<token>` still has `noindex`;
- robots and sitemap output;
- axe on the signed-out pages in all five themes;
- `tsc` and `next build`.

## Not in scope, on purpose

- Public pages for the 2,227 built-in words (they are part of what a paid plan may offer).
- A limit on how many cards a signed-out visitor sees. Easy to add later if the owner wants one.
- Indexing individual card pages.

## Open

- Re-consent for decks submitted before 29 Oct (option A built; B or C if a lawyer asks): the owner and a lawyer.
- Send the announcement, wait 7 days after the last email, then merge (Step 4, "What the owner does").
- After launch, the owner adds the site to Google Search Console and submits the sitemap. Indexing takes days to weeks and is not guaranteed.
