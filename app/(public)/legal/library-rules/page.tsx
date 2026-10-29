// Owns the public library rules: who may publish, what an admin checks, what
// gets a deck rejected or taken down, and the licence a public deck carries.
// The rules themselves come from lib/libraryTerms, the same list the admin's
// review checklist shows.
//
// It deliberately describes only what the app enforces today. A working draft,
// not legal advice; it needs a lawyer's review with the Terms.

import Link from "next/link";

import { LIBRARY_RULES, LICENCES } from "@/lib/libraryTerms";
import { DECK_LIMITS } from "@/lib/deckSchemas";

export const metadata = {
  title: "Library rules — EduSarthi",
  description: "What every deck in the EduSarthi library must follow, and how decks are checked.",
};

const CONTACT = "support@edusarthi.com";

const h2 = "font-display text-base font-bold text-ink";
const link = "font-medium text-accent hover:underline";

export default function LibraryRulesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Library rules</h1>
      <p className="mt-2 text-xs text-ink-muted">Last updated 29 October 2026</p>

      <div className="mt-8 flex flex-col gap-8 text-sm text-ink-muted">
        <section>
          <h2 className={h2}>Who can publish</h2>
          <p className="mt-2">
            Anyone with an EduSarthi account who is 18 or older. Under 18, you can still make decks, study them and share
            them by link. Teachers can publish once an admin has verified their account.
          </p>
        </section>

        <section>
          <h2 className={h2}>Every deck is checked first</h2>
          <p className="mt-2">
            An admin reads every deck before anyone else can find it in the library, and checks it against the rules below.
            If it is not approved, you see the reason on the deck and can fix it and submit again. Small fixes to a published
            deck go live at once and are checked afterwards; bigger changes go in a new version, which is checked before it
            replaces the published one.
          </p>
        </section>

        <section>
          <h2 className={h2}>Who can read a published deck</h2>
          <p className="mt-2">
            Anyone. Once an admin approves a deck, it is open to read for everyone, with or without an account, and search
            engines such as Google may list it. Only people with an account can follow, copy, like or report it, or study it
            with their own progress. The name shown on it is the one you chose in Settings.
          </p>
          <p className="mt-2">
            A deck you share by link is different: it is not in the library, search engines are asked to skip it, and only
            people who have the link can open it. If you withdraw a published deck, it leaves the library and our sitemap at
            once. A search engine may keep its own copy for a while, and copies made under the licence stay with the people
            who made them.
          </p>
        </section>

        <section>
          <h2 className={h2}>The rules</h2>
          <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
            {LIBRARY_RULES.map((r) => (
              <li key={r.title}>
                <b className="text-ink">{r.title}.</b> {r.detail}
              </li>
            ))}
          </ol>
          <p className="mt-2">
            A deck needs at least {DECK_LIMITS.minCardsToPublish} cards to be submitted. Video links on teachers&apos; cards
            must be YouTube or Google Drive.
          </p>
        </section>

        <section>
          <h2 className={h2}>Publishing for an institute</h2>
          <p className="mt-2">
            An institute&apos;s admin and its teachers can publish a deck under the institute&apos;s name, with its logo
            once the EduSarthi admin has approved the logo. You tick that you may publish on the institute&apos;s behalf, and
            the deck is checked like any other. The person who made it is named beside the institute, unless they chose no
            name. The institute&apos;s admin can take its name off any of its decks; the deck then stays in the library under
            the person who made it, and so does a deck whose maker leaves the institute. While an institute is suspended, its
            decks are not shown; a deck whose maker leaves a suspended institute is checked again before it returns.
          </p>
        </section>

        <section>
          <h2 className={h2}>Licence and credit</h2>
          <p className="mt-2">
            Decks you publish carry the{" "}
            <a href={LICENCES.CC_BY_SA.href} target="_blank" rel="noopener noreferrer" className={link}>{LICENCES.CC_BY_SA.label}</a>{" "}
            licence: anyone may share and change them, with credit to you (and to the institute, for its decks), as long as
            they share their version the same way.
            You choose how your name shows, and can change it in Settings. You also let EduSarthi use your public decks in
            paid features. The details are in the <Link href="/legal/terms" className={link}>Terms</Link>.
          </p>
          <p className="mt-2">Decks made by EduSarthi itself are {LICENCES.EDUSARTHI.label} and are not under that licence.</p>
        </section>

        <section>
          <h2 className={h2}>Reports and removal</h2>
          <p className="mt-2">
            Every library deck has a &quot;Report this deck&quot; button. When {DECK_LIMITS.reportsToHide} people have reported
            the same deck, it leaves the library until an admin looks. An admin may take down a deck that breaks these rules;
            its owner sees the reason. Accounts that break them again and again may be suspended.
          </p>
          <p className="mt-2">
            Think a deck copies your work? Report it with &quot;Copied from someone else&quot;, or write to{" "}
            <a href={`mailto:${CONTACT}`} className={link}>{CONTACT}</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
