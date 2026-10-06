// Owns outbound email: verification codes, sign-in codes and links, and
// password reset links.
//
// It deliberately does NOT decide when to send. Callers own that, so a route
// handler can issue a code and skip the email in a test without this file
// knowing anything about it.

import sgMail from "@sendgrid/mail";

const FROM = process.env.EMAIL_FROM ?? "noreply@edusarthi.com";
const API_KEY = process.env.SENDGRID_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (API_KEY) sgMail.setApiKey(API_KEY);

async function send(to: string, subject: string, text: string, html: string) {
  if (!API_KEY) {
    // Throw in production rather than fall through. Logging a live reset link
    // to a production log is handing it to anyone with log access — and
    // silently not sending is worse, because the user waits for an email that
    // was never attempted.
    if (IS_PRODUCTION) {
      throw new Error("SENDGRID_API_KEY is missing — refusing to send email");
    }

    console.log(`\n--- EMAIL (dev, not sent) ---\nTo: ${to}\n${subject}\n${text}\n---\n`);
    return;
  }

  await sgMail.send({ to, from: FROM, subject, text, html });
}

export async function sendVerificationCode(to: string, code: string) {
  const subject = "Your EduSarthi verification code";
  const text = `Your verification code is ${code}. It expires in 10 minutes.\n\nIf you did not create an EduSarthi account, you can ignore this email.`;
  const html = `
    <p>Your EduSarthi verification code is:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
    <p>It expires in 10 minutes.</p>
    <p style="color:#5f6773;font-size:13px">If you did not create an EduSarthi account, you can ignore this email.</p>
  `;

  await send(to, subject, text, html);
}

export async function sendPasswordResetLink(to: string, url: string) {
  const subject = "Reset your EduSarthi password";
  const text = `Open this link to set a new password:\n${url}\n\nThe link works once and expires in 1 hour. If you did not ask to reset your password, you can ignore this email — nothing has changed.`;
  const html = `
    <p>Open this link to set a new password:</p>
    <p><a href="${url}">${url}</a></p>
    <p>The link works once and expires in 1 hour.</p>
    <p style="color:#5f6773;font-size:13px">If you did not ask to reset your password, you can ignore this email — nothing has changed.</p>
  `;

  await send(to, subject, text, html);
}

export async function sendLoginEmail(to: string, code: string, url: string) {
  const subject = `${code} is your EduSarthi sign-in code`;
  const text = `Your sign-in code is ${code}.\n\nOr open this link on the same phone to sign in straight away:\n${url}\n\nBoth expire in 10 minutes and work once. If you did not try to sign in, you can ignore this email.`;
  const html = `
    <p>Your EduSarthi sign-in code is:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
    <p>Or sign in with one tap:</p>
    <p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#0077b3;color:#ffffff;border-radius:8px;text-decoration:none">Sign in to EduSarthi</a></p>
    <p style="color:#5f6773;font-size:13px">Both expire in 10 minutes and work once. If you did not try to sign in, you can ignore this email.</p>
  `;
  await send(to, subject, text, html);
}

/// Tells a deck's owner what an admin decided. `reason` is the admin's note for
/// a rejection or takedown and is empty for an approval.
export async function sendDeckDecision(to: string, title: string, outcome: "approved" | "rejected" | "removed", reason: string) {
  const safe = title.replace(/[<>&"]/g, " ");
  const headline = {
    approved: `Your deck “${safe}” is now in the public library`,
    rejected: `Your deck “${safe}” was not approved`,
    removed: `Your deck “${safe}” was taken out of the library`,
  }[outcome];
  const next =
    outcome === "approved"
      ? "Anyone signed in can now find and copy it. If you change it later, it goes back to review."
      : "Open the deck in My decks to read the note, fix what is needed, and submit it again.";
  const note = reason ? `\n\nReviewer’s note: ${reason}` : "";
  const text = `${headline}.${note}\n\n${next}`;
  const html = `<p>${headline}.</p>${reason ? `<p><b>Reviewer’s note:</b> ${reason.replace(/[<>&]/g, " ")}</p>` : ""}<p>${next}</p>`;
  await send(to, headline, text, html);
}
