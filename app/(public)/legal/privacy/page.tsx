// Owns the privacy policy.
//
// It describes what the application actually does — every claim here maps to a
// column in schema.prisma or a call in lib/storage.ts. If the code changes,
// this page is wrong until it is updated too.
//
// This is a working draft written from the codebase, not legal advice. It needs
// review by a lawyer familiar with India's DPDP Act 2023 before launch.

export const metadata = {
  title: "Privacy — Edusarthi",
  description: "What Edusarthi collects, why, how long it is kept, and your rights.",
};

const CONTACT = "privacy@edusarthi.com";
const UPDATED = "26 August 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Privacy</h1>
      <p className="mt-2 text-xs text-mist">Last updated {UPDATED}</p>

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
              bcrypt hash, never the password itself. Nobody at Edusarthi can
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
            You, and the teacher reviewing your submission. Submissions are
            stored in a private bucket and are never publicly accessible. When a
            page needs to play your recording, we generate a link that stops
            working after thirty minutes.
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
            We do not sell personal data. We use three processors to run the
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
              <span className="text-ink">SendGrid</span> — sends verification
              codes and password reset emails.
            </li>
          </ul>
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
            Submissions and audits are kept while your account exists, because
            your progress over time is the point of the service. Verification
            codes expire after ten minutes and password reset links after one
            hour. Failed sign-in records are only read within a fifteen-minute
            window.
          </p>
          <p className="mt-2">
            When you ask us to delete your account, your submissions and audits
            are deleted with it.
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
            Edusarthi is not intended for children under 18. If you are under 18,
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
