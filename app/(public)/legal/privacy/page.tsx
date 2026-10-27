// Owns the privacy policy.
//
// It describes what the application actually does — every claim here maps to a
// column in schema.prisma or a call in lib/storage.ts. If the code changes,
// this page is wrong until it is updated too.
//
// This is a working draft written from the codebase, not legal advice. It needs
// review by a lawyer familiar with India's DPDP Act 2023 before launch.

export const metadata = {
  title: "Privacy — EduSarthi",
  description: "What EduSarthi collects, why, how long it is kept, and your rights.",
};

const CONTACT = "privacy@edusarthi.com";
const UPDATED = "27 October 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Privacy</h1>
      <p className="mt-2 text-xs text-ink-muted">Last updated {UPDATED}</p>

      <div className="mt-8 flex flex-col gap-8 text-sm text-ink-muted">
        <section>
          <h2 className="font-display text-base font-bold text-ink">
            What we collect
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            <li>
              <span className="text-ink">Your name and email address.</span>{" "}
              Required to create an account. The email is verified with a
              six-digit code before the account can be used.
            </li>
            <li>
              <span className="text-ink">Your mobile number, if you give it.</span>{" "}
              Optional. We store it but do not verify it and do not currently
              send SMS.
            </li>
            <li>
              <span className="text-ink">Your password, hashed.</span> We store a
              bcrypt hash, never the password itself. Nobody at EduSarthi can
              read or recover it.
            </li>
            <li>
              <span className="text-ink">
                The recordings, videos and photographs you submit.
              </span>{" "}
              These are the substance of the service.
            </li>
            <li>
              <span className="text-ink">The audits teachers write about them</span>{" "}
              — five scores, a written summary, and timestamped notes.
            </li>
            <li>
              <span className="text-ink">
                What you give the AI card maker, and what it makes.
              </span>{" "}
              This is the request you type, your answers to its questions,
              any text, PDF or photo you add, and the cards it writes, which
              are marked &ldquo;AI-assisted&rdquo; wherever they appear. We
              also keep your last answers to the questions, so they can be
              offered again, and a count of the AI cards and the AI usage on
              your account.
            </li>
            <li>
              <span className="text-ink">
                A written transcript of an audio recording.
              </span>{" "}
              It is made only when a teacher asks for an AI-assisted draft of
              your audit, and it is kept with the submission.
            </li>
            <li>
              <span className="text-ink">The decks you make and share.</span>{" "}
              Their cards, pictures and audio; the email address of each person
              you invite to a deck, kept even before they have an account; the
              decks you follow, like or report; and, for a deck in the public
              library, a log of small fixes (the text before and after, and who
              made it).
            </li>
            <li>
              <span className="text-ink">Your choices for the deck library.</span>{" "}
              Your answer that you are 18 or older (asked once), how your name
              shows on public decks and any display name you type, and the date
              and version of the library terms you accepted for each deck you
              publish or edit.
            </li>
            <li>
              <span className="text-ink">Institutes.</span> If you apply for an
              institute: its name, a description, a contact line and its logo. For
              every institute: who belongs to it and their role.
            </li>
            <li>
              <span className="text-ink">Failed sign-in attempts.</span> We record
              the email address and the time of failed sign-ins, for fifteen
              minutes, to slow down password guessing.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            Who can see your submissions
          </h2>
          <p className="mt-2">
            You, and the teacher reviewing your submission. Teachers see your
            student ID, not your name or email. A site administrator can also
            open a submission, to reassign it, to check a complaint, or to keep
            reviews fair. A recording you make on a teacher&apos;s own flashcard
            deck is sent only to that teacher. Submissions are stored in a
            private bucket and are never publicly accessible. When a page needs
            to play your recording, we generate a link that stops working after
            thirty minutes.
          </p>
          <p className="mt-2">
            We do not publish your recordings, use them as examples, sell them,
            or use them to train machine-learning models.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            Who we share data with
          </h2>
          <p className="mt-2">
            We do not sell personal data. We use these processors to run the
            service, and each sees only what it needs:
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            <li>
              <span className="text-ink">Supabase</span> — hosts the database and
              the private storage bucket.
            </li>
            <li>
              <span className="text-ink">Vercel</span> — hosts and serves the
              application.
            </li>
            <li>
              <span className="text-ink">SendGrid</span> — sends our emails:
              sign-in and verification codes, password resets, news about your
              decks (decisions, invitations, undone fixes), the audit and study
              reminders you switch on, and announcements such as changes to
              these pages.
            </li>
            <li>
              <span className="text-ink">OpenAI</span> — turns an audio
              recording into text, only when a teacher asks for an AI-assisted
              draft.
            </li>
            <li>
              <span className="text-ink">Anthropic</span> — receives that text
              and writes a draft audit for the teacher to check and edit. It also
              reads what you give the AI card maker and writes the cards.
            </li>
          </ul>
          <p className="mt-2">
            When a teacher asks for an AI-assisted draft, the audio of that one
            submission goes to OpenAI, and the text of it goes to Anthropic. We
            do not send your name, email address or student ID with it, but
            anything you say in the recording, including a name, is part of what
            is sent. The draft is only a starting point: a teacher listens to
            your recording, changes the draft and decides what you receive. Both
            companies keep data under their own terms; read their privacy
            policies for how long.
          </p>
          <p className="mt-2">
            When you use the AI card maker, what you type, your answers to its
            questions, and any text, PDF or photo you add go to Anthropic. We do
            not send your name, email address or student ID with them, but
            anything you write or photograph, including a name, is part of what
            is sent. The cards it writes can be wrong, so every one is marked
            &ldquo;AI-assisted&rdquo; and you choose which to keep. Anthropic
            keeps data under its own terms; read its privacy policy for how
            long.
          </p>
          <p className="mt-2">
            If a teacher&apos;s flashcard includes a video, it plays from YouTube
            or Google Drive, so your phone contacts them when you open that
            card. Decks you share by link are visible to anyone who has the link,
            and decks you submit to the public library are visible to every
            signed-in user once an administrator approves them.
          </p>
          <p className="mt-2">
            A public deck shows your name the way you chose (or no name), the
            institute&apos;s name and logo if you published it for an institute,
            and the names of editors who chose to show one. People you share a
            deck with by name can see it; you see the email addresses you
            invited. An institute&apos;s admin sees its members&apos; names and
            email addresses.
          </p>
          <p className="mt-2">
            We may disclose data where we are legally required to, and we will
            tell you where we are permitted to do so.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            How long we keep it
          </h2>
          <p className="mt-2">
            Your recordings are deleted from storage 90 days after you send
            them. The audit itself (scores and the teacher&apos;s notes) is kept
            while your account exists, because your progress over time is the
            point of the service. Verification
            codes expire after ten minutes and password reset links after one
            hour. Failed sign-in records are only read within a fifteen-minute
            window.
          </p>
          <p className="mt-2">
            A PDF or photo you add to the AI card maker is kept in our private
            storage only until the cards are made, and is then deleted. If you
            leave before that, it is deleted by our daily clean-up, which can
            take up to two days. Pasted text is not stored; it is sent with your
            request. The cards you add to a deck, and your last answers to the
            questions, are kept while your account exists.
          </p>
          <p className="mt-2">
            When you delete your account, your submissions, audits, flashcard
            progress and decks are deleted with it, and we remove your stored
            recordings, card pictures and any files waiting in the AI card maker. If storage is unavailable at that
            moment, a file can be left behind until we clear it; write to us if
            you want it confirmed. A copy of one of your decks that another
            person made is theirs and stays with them.
          </p>
          <p className="mt-2">
            Your public decks leave the library with your account, but two things
            stay with other people. A copy made under the CC BY-SA licence keeps
            its &ldquo;Copied from&rdquo; line, with the name you chose, because
            the licence requires the credit. Cards you added to someone
            else&apos;s deck as an editor stay in their deck. An invitation to
            your email address that you never accepted stays in the inviter&apos;s
            deck until they remove it or delete the deck.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            Your rights
          </h2>
          <p className="mt-2">
            You can ask us for a copy of your data, ask us to correct it, or ask
            us to delete your account and everything in it. Email{" "}
            <a
              href={`mailto:${CONTACT}`}
              className="font-medium text-accent hover:underline"
            >
              {CONTACT}
            </a>{" "}
            from the address on your account and we will act within thirty days.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            Children
          </h2>
          <p className="mt-2">
            EduSarthi is not intended for children under 18. If you are under 18,
            do not create an account without a parent or guardian&apos;s consent.
            If we learn we hold a child&apos;s data without that consent, we will
            delete it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">Changes</h2>
          <p className="mt-2">
            If we change what we collect or who we share it with, we will update
            the date at the top of this page and email account holders before the
            change takes effect.
          </p>
        </section>
      </div>
    </main>
  );
}
