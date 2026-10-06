// Owns the terms of use.
//
// Written to match what the application actually enforces — the queue order,
// the fact audits cannot be edited, the manual teacher accounts. Nothing here
// promises behaviour the code does not have.
//
// This is a working draft, not legal advice. It needs review by a lawyer before
// launch, particularly the liability and governing-law sections.

export const metadata = {
  title: "Terms — EduSarthi",
  description: "The terms you agree to when you use EduSarthi.",
};

const CONTACT = "support@edusarthi.com";
const UPDATED = "26 August 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Terms of use</h1>
      <p className="mt-2 text-xs text-ink-muted">Last updated {UPDATED}</p>

      <div className="mt-8 flex flex-col gap-8 text-sm text-ink-muted">
        <section>
          <h2 className="font-display text-base font-bold text-ink">
            What you are agreeing to
          </h2>
          <p className="mt-2">
            By creating an account you agree to these terms. If you do not agree
            with them, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            Your account
          </h2>
          <p className="mt-2">
            One account per person. You are responsible for keeping your password
            private, and for anything done through your account. Tell us at{" "}
            <a
              href={`mailto:${CONTACT}`}
              className="font-medium text-accent hover:underline"
            >
              {CONTACT}
            </a>{" "}
            if you think someone else has access to it.
          </p>
          <p className="mt-2">
            Teacher accounts are created by us, not through the signup form,
            because a teacher account can read student submissions.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            What you submit
          </h2>
          <p className="mt-2">
            You keep ownership of everything you record, film or photograph. You
            give us permission to store it and show it to the teacher reviewing
            it — nothing more.
          </p>
          <p className="mt-2">Do not submit:</p>
          <ul className="mt-2 flex flex-col gap-1">
            <li>Recordings of other people made without their knowledge.</li>
            <li>Anything unlawful, abusive, or intended to harass someone.</li>
            <li>
              Personal information you would not want a teacher to hold —
              identification numbers, bank details, passwords.
            </li>
            <li>
              Work that is not yours, presented as yours. The audit is worthless
              if the recording is not you.
            </li>
          </ul>
          <p className="mt-2">
            We may remove submissions that break these rules and close accounts
            that do so repeatedly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            What the audits are, and are not
          </h2>
          <p className="mt-2">
            An audit is one teacher&apos;s assessment of one submission. It is a
            professional opinion, not a certified result. Scores are not a
            qualification, are not recognised by any examination board, and
            should not be presented to anyone as one.
          </p>
          <p className="mt-2">
            Audits are written by people, so two teachers may score the same
            recording slightly differently. Once an audit is sent it cannot be
            edited — if you think one is wrong, email us and we will look at it.
          </p>
          <p className="mt-2">
            We do not promise a turnaround time. Submissions are reviewed oldest
            first and the wait depends on how many are in the queue.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            Availability
          </h2>
          <p className="mt-2">
            We aim to keep the service running but do not guarantee it will be
            available without interruption. We may change or withdraw features,
            and will give notice of significant changes where we reasonably can.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            Ending your use
          </h2>
          <p className="mt-2">
            You can ask us to close your account at any time; your submissions
            and audits are deleted with it. We may suspend or close an account
            that breaks these terms, and will tell you why.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            Liability
          </h2>
          <p className="mt-2">
            The service is provided as it is. To the extent the law allows, we
            are not liable for indirect or consequential loss arising from your
            use of it. Nothing here limits liability that cannot lawfully be
            limited.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">
            Governing law
          </h2>
          <p className="mt-2">
            These terms are governed by the laws of India, and the courts of
            India have jurisdiction over any dispute arising from them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">Changes</h2>
          <p className="mt-2">
            We will update the date at the top of this page when these terms
            change, and email account holders before a significant change takes
            effect.
          </p>
        </section>
      </div>
    </main>
  );
}
