// Owns outbound email: verification codes and password reset links.
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
  const subject = "Your Edusarthi verification code";
  const text = `Your verification code is ${code}. It expires in 10 minutes.\n\nIf you did not create an Edusarthi account, you can ignore this email.`;
  const html = `
    <p>Your Edusarthi verification code is:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
    <p>It expires in 10 minutes.</p>
    <p style="color:#6b6470;font-size:13px">If you did not create an Edusarthi account, you can ignore this email.</p>
  `;

  await send(to, subject, text, html);
}

export async function sendPasswordResetLink(to: string, url: string) {
  const subject = "Reset your Edusarthi password";
  const text = `Open this link to set a new password:\n${url}\n\nThe link works once and expires in 1 hour. If you did not ask to reset your password, you can ignore this email — nothing has changed.`;
  const html = `
    <p>Open this link to set a new password:</p>
    <p><a href="${url}">${url}</a></p>
    <p>The link works once and expires in 1 hour.</p>
    <p style="color:#6b6470;font-size:13px">If you did not ask to reset your password, you can ignore this email — nothing has changed.</p>
  `;

  await send(to, subject, text, html);
}
