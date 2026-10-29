# Legal review pack — deck library v2 (Phase 6)

Status: **written by the assistant on 27 Oct 2026, NOT by a lawyer, and NOT legal advice.** The owner has no lawyer yet and asked for this review to be done now and approved by a lawyer later. Until then, every page it covers is a working draft.

Labels used below: **CONFIRMED** = checked in our own code; **LIKELY** = what the law appears to say, from general knowledge, not checked against the current text; **UNCERTAIN** = needs a lawyer to say whether it applies at all.

## 1. What the lawyer should read

| Page | What it is |
|---|---|
| `/legal/terms` (`app/(public)/legal/terms/page.tsx`) | Terms of use. The section "Decks you publish to the library" is new (Phases 1–5). |
| `/legal/privacy` (`app/(public)/legal/privacy/page.tsx`) | Privacy policy, written from the code. |
| `/legal/library-rules` (`app/(public)/legal/library-rules/page.tsx`) | What gets a deck rejected or taken down, licence and credit, institutes. |
| The submit form (`components/decks/PublishConsent.tsx`) | The ticks a creator gives: 18+, own work, CC BY-SA, **anyone can read it (added 29 Oct)**, paid use, and "on behalf of the institute". |
| The editor's terms box (`components/decks/EditorTerms.tsx`) and invite acceptance | What an editor of a public deck agrees to. |
| The announcement email (Admin → Announcements, text in `lib/announcements.ts`) | How account holders are told about these changes. |

## 2. What changed for users (plain words)

All of this went live when PR #18 was merged on 27 Oct 2026. Every part is opt-in: nothing changes for a user who does not publish, share or join an institute.

- Adults (18+, by a tick box) can publish decks to a public library. Every deck is checked by an admin first.
- Published decks are licensed to everyone under CC BY-SA 4.0. EduSarthi also gets a separate permission to use them in paid features. Creators may be rewarded later (not decided, nothing owed yet).
- Creators choose how their name shows: full name, first name, a display name, or no name.
- Learners can follow a public deck or copy it. A copy says "Copied from <title> by <name>", and that line stays even after the original is deleted.
- Small fixes to a public deck go live at once and are checked after; bigger changes are checked first.
- Decks can be shared with named people (by email), to view or edit. Editors of a public deck accept the library terms; what they add becomes part of the owner's deck.
- Institutes' admins and teachers can publish under the institute's name and logo. The logo is checked by an admin. The institute's admin can take its name off any deck.

## 3. Fixed in this review (27 Oct 2026)

These were statements that no longer matched the code (CONFIRMED). Fixed in the pages directly:

- **Privacy → What we collect** now lists: the decks you make and share (including the email address of each person you invite, kept even before they have an account), follows, likes, reports, the small-fix log; the 18+ answer, the name choice and display name, the terms version accepted per deck; institute details, logo and membership.
- **Privacy → SendGrid** said it sends only verification codes and password resets. It now lists every kind of email we send.
- **Privacy → who can see** now says what a public deck shows (name as chosen, institute name and logo, editors' names), who sees invitees' email addresses, and that an institute's admin sees members' names and emails.
- **Privacy → deletion** now says what stays with other people after you delete your account: the "Copied from" credit on copies (the licence requires it), cards you added to someone else's deck, and invitations to your address that you never accepted.
- **Terms → library** now covers small fixes (and that an admin may undo one), followers losing a withdrawn deck, editors' contributions, and publishing for an institute (authority, removal of the name, the logo).
- **Terms → ending your use** now says decks are deleted with the account, and what stays with others.
- Both pages now say "Last updated 27 October 2026".

## 4. Open issues for the lawyer

1. **Children's data (DPDP Act 2023) — the biggest open question.** LIKELY: the Act treats anyone under 18 as a child; it requires *verifiable* consent from a parent before processing a child's personal data, and forbids tracking or behavioural monitoring of children and advertising aimed at them. Its rules are being brought into force in stages, so the dates that apply to us must be checked. CONFIRMED in our code: sign-up asks no age; the privacy page says the service is "not intended for children under 18" and asks under-18s to get a parent's consent, but nothing checks that; the owner's decision 12 expects under-18 learners to use decks. Study progress (what a learner knows, when cards are due) may count as monitoring. **Questions:** Does this apply to EduSarthi now, and from when? What counts as verifiable parental consent for us? Do we need an age question at sign-up?
2. **Who runs EduSarthi.** CONFIRMED: neither the Terms nor the Privacy page names the legal operator (a company or a person) or a postal address; they only say "we". **Question:** what must be named, and where? *The owner must supply the name and address.*
3. **Complaints officer for user content.** UNCERTAIN whether EduSarthi counts as an intermediary for decks users publish. If it does, the IT Rules 2021 LIKELY require a published grievance officer, acknowledging complaints within 24 hours and deciding within 15 days, with shorter deadlines for some content. Today the library rules give `support@edusarthi.com` and a Report button. **Question:** do we need a named grievance officer and published timelines? *The owner would have to name the person.*
4. **CC BY-SA plus the paid-use permission.** CONFIRMED wording: creators license CC BY-SA 4.0 to everyone and grant EduSarthi a separate non-exclusive, royalty-free permission to use, copy, adapt and include the deck in features "including paid ones". **Questions:** Is that enough for paid features that bundle or change decks, and does it need to say whether EduSarthi must credit the creator there? Do moral rights under Indian copyright law change anything? Is "plans to reward creators … nothing is owed until it is announced" safe?
5. **Age check by tick box.** CONFIRMED: publishing asks "I am 18 or older" once per account; nothing verifies it. **Question:** is a tick enough for a public licence grant, or do we need a date of birth?
6. **Editors.** CONFIRMED: an editor of a public deck ticks 18+ and the library terms before editing; what they add is stored as part of the owner's deck and published under the same licence; they are credited only if they chose a name. **Question:** does the editor's tick validly license their contributions, and is crediting "no name" acceptable under CC BY-SA?
7. **Institutes.** CONFIRMED: a teacher or the institute's admin ticks "I may publish this deck on behalf of <Institute>"; the institute's admin can take the name off; the logo is uploaded by the institute's admin and approved by our admin. **Questions:** Is a teacher's tick enough authority to put an institute's name on a deck? Do we need an express trademark permission for logos beyond the sentence now in the Terms?
8. **Invitees' email addresses.** CONFIRMED: an invitation to someone with no account keeps their email address until the deck owner removes it or deletes the deck; the person never agreed to anything. **Question:** is that acceptable, or should unaccepted invitations expire (for example after 30 days)? *Building an expiry is small if wanted.*
9. **Timing of the notice.** CONFIRMED: both pages promise an email to account holders before a significant change takes effect; the library features went live on 27 Oct before any email (Phase 6 sends it). Every new feature is opt-in. **Question:** is that enough, or should anything be done beyond the email and the in-app notice?
10. **Data stored outside India.** CONFIRMED: we use Supabase, Vercel, SendGrid, OpenAI and Anthropic; the privacy page names them but not where they store data. LIKELY: the DPDP Act allows transfers abroad unless the government restricts a country. **Question:** must the page say where data is stored?
11. **Liability and governing law.** The Terms say "courts of India" without a city, and limit liability in general words. **Question:** are these sections enough?

## 4b. Opening the library to everyone (written 29 Oct 2026, same caveats)

**What changes (CONFIRMED, in code on branch `claude/bold-hopper-hxfrpd`, not live):** today `/library` needs an account. The branch opens the list, each deck and each card to anyone, with or without an account, and publishes a sitemap so search engines can list the decks. Following, copying, liking, reporting and studying still need an account. Details: `docs/PUBLIC-LIBRARY-PLAN.md`.

**What was done about consent:** the Privacy page no longer says public decks are visible only to signed-in users; the Terms, Library rules, Help, Profile and approval-email wording say anyone can read them and search engines may list them; the submit form has a fourth required tick for it and `LIBRARY_TERMS_VERSION` is `2026-10-29`; the editor's tick says it too; an announcement email ("EduSarthi: the deck library will be open to everyone") is drafted in Admin → Announcements and promises that the change starts no earlier than 7 days after the last email is sent.

12. **Creators who submitted before (the central question).** CONFIRMED: a deck submitted under terms `2026-10-27` was agreed to when the Privacy page said "every signed-in user", and nothing makes those creators agree again; the new tick applies to new submissions and new versions only. (Issue 9 already asks whether the notice for the 27 Oct features was enough; whether that announcement has been sent is not recorded here.) **Question:** is an email, seven days' notice and the choices to withdraw a deck or change the name shown (both instant) enough for existing decks, or must each creator accept again before their deck shows to visitors? *Three options, none built beyond the first: (A) notice and withdraw, as built; (B) hold each old deck back from visitors and search engines until its creator accepts, which needs a small "accept the new terms" step and a version check where decks are listed; (C) show visitors "an EduSarthi learner" instead of the chosen name until the creator accepts, so names stay inside the app until then. The assistant would take C or B if the lawyer is unsure; A is the lightest.*
13. **Names on the open web.** CONFIRMED: a creator's chosen name (full name, first name or a display name) is shown on the deck page and in the list to everyone, and is in the page text a search engine reads; it is not in the page title, description or share preview. Only people 18 or older can publish. **Question:** is that a new purpose that needs fresh consent, and should the form say so next to the name choice, not only in the new tick?
14. **Copies we cannot recall.** CONFIRMED: a withdrawn deck leaves the library and the sitemap at once and its page is marked `noindex`, but a search engine may keep a copy for a while, and CC BY-SA copies stay with whoever made them. The Terms and Privacy pages say so. **Question:** is the wording enough, and is there anything to do beyond asking search engines to drop it (for example, using their removal tools on request)?
15. **A page that is "not found" but answers 200.** CONFIRMED: a withdrawn deck shows a not-found page with `noindex`, but the HTTP status is 200, because the page streams (Next 16 documents this). Search engines treat that as a removed page after a recrawl. **Question:** none legal; recorded so nobody is surprised.

## 5. What happens next

- The owner finds a lawyer and sends them this file and the pages in section 1.
- Every change the lawyer asks for goes in a new chat, recorded in `docs/LIBRARY-V2-PLAN.md`.
- Issue 1 (children) may need code: an age question at sign-up and a parental consent step. Nothing is built for it yet; it waits for the lawyer.
