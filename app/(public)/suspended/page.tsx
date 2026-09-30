// Owns the page a suspended account lands on. It says what happened and how to
// reach a person, and offers sign-out — nothing else in the app is reachable.
//
// It deliberately does not show the admin's written reason. That is an
// internal note; support can explain it to the account holder directly.

import { SignOutButton } from "@/app/(public)/suspended/SignOutButton";

export default function SuspendedPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">This account is paused</h1>
      <p className="mt-3 text-sm text-ink-muted">
        An administrator has suspended this account, so it cannot be used right now. If you think
        this is a mistake, email <span className="font-medium text-ink">support@edusarthi.com</span>{" "}
        from the address you signed up with.
      </p>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </main>
  );
}
