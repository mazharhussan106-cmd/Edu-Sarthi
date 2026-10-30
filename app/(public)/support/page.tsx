// Owns the support page: the problems people actually hit, with the fix next to
// each one, and a way to reach a human when none of them apply.
//
// It deliberately answers the technical failures first. Someone opening this
// page is usually stuck on a microphone permission or a stalled upload, not
// reading about the product.
// The list itself lives in lib/helpContent, which the help chatbot also reads.

import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/Card";
import { SUPPORT_EMAIL, SUPPORT_ISSUES } from "@/lib/helpContent";

export const metadata = {
  title: "Support — EduSarthi",
  description: "Fixes for common problems with recording, uploading and signing in.",
};


export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Support</h1>
      <p className="mt-3 text-sm text-ink-muted">
        The problems people hit most, and what to do about each one.
      </p>

      <div className="mt-8 divide-y divide-border border-y border-border">
        {SUPPORT_ISSUES.map((item) => (
          // Native <details>: open/close, keyboard support and screen reader
          // announcement all come free, and the page ships no JavaScript.
          <details key={item.q} className="group py-4">
            <summary className="cursor-pointer list-none font-body text-sm font-medium text-ink marker:hidden">
              <span className="flex items-start justify-between gap-4">
                {item.q}
                <span
                  aria-hidden="true"
                  className="text-ink-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2 text-sm text-ink-muted">{item.a}</p>
          </details>
        ))}
      </div>

      <Card className="mt-10">
        <CardTitle>Still stuck</CardTitle>
        <p className="mt-2 text-sm text-ink-muted">
          Email{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-accent hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          . Tell us which browser and phone you are using and what you saw on
          screen — that is usually enough to find it without a back-and-forth.
        </p>
        <p className="mt-3 text-xs text-ink-muted">
          We read every message. We are a small team, so a reply may take a day
          or two.
        </p>
      </Card>

      <p className="mt-8 text-xs text-ink-muted">
        Looking for how the product works instead?{" "}
        <Link href="/about" className="font-medium text-accent hover:underline">
          Read the about page
        </Link>
        .
      </p>
    </main>
  );
}
