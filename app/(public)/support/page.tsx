// Owns the support page: the problems people actually hit, with the fix next to
// each one, and a way to reach a human when none of them apply.
//
// It deliberately answers the technical failures first. Someone opening this
// page is usually stuck on a microphone permission or a stalled upload, not
// reading about the product.

import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/Card";

export const metadata = {
  title: "Support — EduSarthi",
  description: "Fixes for common problems with recording, uploading and signing in.",
};

const SUPPORT_EMAIL = "support@edusarthi.com";

const ISSUES = [
  {
    q: "The Record button does nothing, or asks for permission and then fails",
    a: "Your browser is blocking the microphone. Press the icon at the left of the address bar, set the microphone to Allow, and reload the page. On iPhone, Settings → Safari → Microphone must also be set to Ask or Allow. If it still fails, use Upload a file instead — a voice memo recorded in your phone's own app works exactly as well.",
  },
  {
    q: "Recording works on my laptop but not on my phone",
    a: "Recording only works over a secure connection. If you opened the site by typing an address like 192.168.0.5:3000, the browser will refuse microphone access. Use the real edusarthi.com address instead.",
  },
  {
    q: "The upload gets stuck on Uploading",
    a: "This is almost always the connection. Wait for it to fail rather than closing the tab — your recording is still on the page, and pressing Send again retries it. On mobile data, a two-minute video can take a few minutes.",
  },
  {
    q: "My file was rejected as the wrong type",
    a: "Each exercise asks for one kind of submission — audio, video, or a photo of written work. The exercise page says which. Sending a photo to a speaking exercise is refused before it uploads.",
  },
  {
    q: "I never got the verification code",
    a: "Check your spam folder first. The code expires after ten minutes, so if it has been longer, press Send a new code on the verification page. There is a sixty-second wait between codes.",
  },
  {
    q: "Too many attempts when signing in",
    a: "Eight wrong passwords in fifteen minutes pauses sign-in for that email. Nothing is locked and nobody can lock you out permanently — wait a few minutes, or use the reset link.",
  },
  {
    q: "My audit still says waiting",
    a: "Submissions are reviewed oldest first by a person, so the wait depends on the queue. The status on your dashboard is accurate — Waiting means no teacher has opened it yet, Being reviewed means one has.",
  },
  {
    q: "Can I become a teacher?",
    a: "Not through the signup form. A teacher account can read student submissions, so those are set up by hand. Email us if you teach English and want to be considered.",
  },
] as const;

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Support</h1>
      <p className="mt-3 text-sm text-ink-muted">
        The problems people hit most, and what to do about each one.
      </p>

      <div className="mt-8 divide-y divide-border border-y border-border">
        {ISSUES.map((item) => (
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
