// Owns outbound email: the one sending function (sendEmail), verification
// codes, sign-in codes and links, password reset links, and the deck and
// announcement emails. Account changes are in lib/emailAccount; the "something
// is waiting for you" notices (audits, reminders, queue) in lib/emailNotices.
//
// It deliberately does NOT decide when to send. Callers own that, so a route
// handler can issue a code and skip the email in a test without this file
// knowing anything about it.

import sgMail from "@sendgrid/mail";

const FROM = process.env.EMAIL_FROM ?? "noreply@edusarthi.com";
const API_KEY = process.env.SENDGRID_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (API_KEY) sgMail.setApiKey(API_KEY);

/// The one way mail leaves the app; the email modules beside this one build
/// their messages and call it.
export async function sendEmail(to: string, subject: string, text: string, html: string) {
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

  try {
    await sgMail.send({ to, from: FROM, subject, text, html });
  } catch (err) {
    // Callers swallow this and show a generic "could not send" message, so
    // without a log line the real reason (unverified sender, revoked key, daily
    // limit) is invisible in Vercel. Status and SendGrid's own messages only —
    // never the key, and never the recipient.
    const e = err as { code?: number; response?: { body?: { errors?: { message?: string }[] } } };
    console.error(
      "SendGrid send failed",
      e.code,
      e.response?.body?.errors?.map((x) => x.message).join(" | "),
    );
    throw err;
  }
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

  await sendEmail(to, subject, text, html);
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

  await sendEmail(to, subject, text, html);
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
  await sendEmail(to, subject, text, html);
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
      ? "Anyone signed in can now find, follow and copy it. Small fixes go live at once; for bigger changes, start a new version, and this one stays live while it is reviewed."
      : "Open the deck in My decks to read the note, fix what is needed, and submit it again.";
  const note = reason ? `\n\nReviewer’s note: ${reason}` : "";
  const text = `${headline}.${note}\n\n${next}`;
  const html = `<p>${headline}.</p>${reason ? `<p><b>Reviewer’s note:</b> ${reason.replace(/[<>&]/g, " ")}</p>` : ""}<p>${next}</p>`;
  await sendEmail(to, headline, text, html);
}

/// An announcement an admin wrote (lib/announcements), sent as typed. The HTML
/// copy is built from the plain text: escaped first, so nothing an admin types
/// can become markup, then blank lines become paragraphs and web addresses links.
export async function sendAnnouncement(to: string, subject: string, body: string) {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const html = body
    .split(/\n\s*\n/)
    .map((para) => `<p>${escape(para).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}">${u}</a>`).replace(/\n/g, "<br>")}</p>`)
    .join("");
  await sendEmail(to, subject, body, html);
}

/// Tells a deck's owner that their institute's admin took the institute's name
/// (and logo) off their library deck. Nothing else about the deck changed.
export async function sendInstituteNameRemoved(to: string, title: string, institute: string) {
  const safe = title.replace(/[<>&"]/g, " ");
  const inst = institute.replace(/[<>&"]/g, " ");
  const subject = `“${safe}” is no longer published as ${inst}`;
  const next = "The deck stays in the public library under your own name, as you chose to be credited. Your followers keep it. If you think this is a mistake, talk to your institute’s admin.";
  const text = `The admin of ${inst} took the institute’s name and logo off your deck “${safe}”.\n\n${next}`;
  const html = `<p>The admin of ${inst} took the institute’s name and logo off your deck “${safe}”.</p><p>${next}</p>`;
  await sendEmail(to, subject, text, html);
}

/// Invites someone to a deck shared with them by name. Sent to an address the
/// owner typed, so it says who invited them and links only to My decks, where
/// the invitation waits until they sign in with this email and accept it.
export async function sendDeckInvite(to: string, from: string, title: string, role: "VIEW" | "EDIT", url: string) {
  const who = from.replace(/[<>&"]/g, " ").slice(0, 60);
  const safe = title.replace(/[<>&"]/g, " ");
  const what = role === "EDIT" ? "edit" : "view";
  const subject = `${who} invited you to ${what} a flashcard deck on EduSarthi`;
  const body = `${who} invited you to ${what} the deck “${safe}”. Sign in to EduSarthi with this email address and open My decks to accept or decline. No account yet? Sign up with this address and the invitation will be waiting.`;
  const text = `${body}\n\n${url}\n\nIf you do not know this person, ignore this email; nothing happens unless you accept.`;
  const html = `<p>${body}</p><p><a href="${url}">Open My decks</a></p><p style="color:#666;font-size:12px">If you do not know this person, ignore this email; nothing happens unless you accept.</p>`;
  await sendEmail(to, subject, text, html);
}

/// Tells a creator an admin undid one of their small fixes, and why. The card
/// is named by its front, so they can find it; the deck page shows it too.
export async function sendFixUndone(to: string, title: string, card: string, reason: string) {
  const safe = title.replace(/[<>&"]/g, " ");
  const front = card.replace(/[<>&"]/g, " ").slice(0, 80);
  const subject = `A fix in your deck “${safe}” was undone`;
  const next = "The card is back to how it was before your fix. You can fix it again tomorrow, or start a new version for a bigger change.";
  const text = `An admin undid your fix to the card “${front}”.\n\nReason: ${reason}\n\n${next}`;
  const html = `<p>An admin undid your fix to the card “${front}”.</p><p><b>Reason:</b> ${reason.replace(/[<>&]/g, " ")}</p><p>${next}</p>`;
  await sendEmail(to, subject, text, html);
}
