// Owns the page shown for any address that does not exist, or a record the
// visitor may not see (private decks answer with this too, so their existence
// is not revealed). It says what to do next and links to the home page.
// It deliberately does not search or suggest pages.

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">We could not find that page</h1>
      <p className="mt-2 text-sm text-ink-muted">
        The link may be old, mistyped, or for something that was removed or is private. Go back and open it from the menu, or start from the home page.
      </p>
      <Link href="/" className="mt-5 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
        Go to the home page
      </Link>
    </main>
  );
}
