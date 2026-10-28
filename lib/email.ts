// Owns outbound email: verification codes, sign-in codes and links, password
// reset links, and every notice the app sends (decks, audits, reminders,
// announcements).
//
// It deliberately does NOT decide when to send. Callers own that, so a route
// handler can issue a code and skip the email in a test without this file
// knowing anything about it.

import sgMail from "@sendgrid/mail";

import { SLA_HOURS, URGENT_WITHIN_HOURS } from "@/lib/claims";

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
      ? "Anyone signed in can now find, follow and copy it. Small fixes go live at once; for bigger changes, start a new version, and this one stays live while it is reviewed."
      : "Open the deck in My decks to read the note, fix what is needed, and submit it again.";
  const note = reason ? `\n\nReviewer’s note: ${reason}` : "";
  const text = `${headline}.${note}\n\n${next}`;
  const html = `<p>${headline}.</p>${reason ? `<p><b>Reviewer’s note:</b> ${reason.replace(/[<>&]/g, " ")}</p>` : ""}<p>${next}</p>`;
  await send(to, headline, text, html);
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
  await send(to, subject, body, html);
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
  await send(to, subject, text, html);
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
  await send(to, subject, text, html);
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
  await send(to, subject, text, html);
}

/// Tells a student their recording has been audited. Links to the audit, never
/// quotes it: scores and notes stay behind sign-in.
export async function sendAuditReady(to: string, url: string) {
  const subject = "Your teacher has returned your audit";
  const text = `Your teacher has audited your recording.\n\nOpen it here: ${url}\n\nYou get this email because "Email me when a teacher returns my audit" is on in Settings. You can switch it off there.`;
  const html = `<p>Your teacher has audited your recording.</p><p><a href="${url}">Open your audit</a></p><p style="color:#666;font-size:12px">You get this email because “Email me when a teacher returns my audit” is on in Settings. You can switch it off there.</p>`;
  await send(to, subject, text, html);
}

/// The once-a-day study nudge. Only sent when cards are actually due, so it is
/// never a "come back" email with nothing behind it.
export async function sendStudyReminder(to: string, due: number, url: string) {
  const subject = `${due} flashcard${due === 1 ? " is" : "s are"} due for review today`;
  const text = `${due} flashcard${due === 1 ? " is" : "s are"} waiting for review.\n\nStart here: ${url}\n\nYou get this email because the daily reminder is on in Settings. You can switch it off there.`;
  const html = `<p>${due} flashcard${due === 1 ? " is" : "s are"} waiting for review.</p><p><a href="${url}">Start reviewing</a></p><p style="color:#666;font-size:12px">You get this email because the daily reminder is on in Settings. You can switch it off there.</p>`;
  await send(to, subject, text, html);
}

/// The evening queue email for teachers and admins. Counts only, never a
/// student's id or recording: the queue itself stays behind sign-in.
export async function sendQueueDigest(to: string, waiting: number, urgent: number, url: string) {
  const subject = `${waiting} recording${waiting === 1 ? " is" : "s are"} waiting for an audit`;
  const urgentLine = urgent > 0 ? `${urgent} of them ${urgent === 1 ? "has" : "have"} less than ${URGENT_WITHIN_HOURS} hours left before the ${SLA_HOURS}-hour deadline.` : "";
  const off = "You get this email because the daily queue email is on in Settings. You can switch it off there.";
  const text = `${subject}.\n${urgentLine ? `${urgentLine}\n` : ""}\nOpen the queue: ${url}\n\n${off}`;
  const html = `<p>${subject}.</p>${urgentLine ? `<p><b>${urgentLine}</b></p>` : ""}<p><a href="${url}">Open the queue</a></p><p style="color:#666;font-size:12px">${off}</p>`;
  await send(to, subject, text, html);
}

/// Sent after a password is changed from Settings. Every session has already
/// ended, so if this was not the owner, Forgot password is the way back in.
export async function sendPasswordChanged(to: string, url: string) {
  const subject = "Your EduSarthi password was changed";
  const ifNot = "If you did not do this, use Forgot password on the sign-in page now to set a new one, then write to us from the Support page.";
  const text = `The password for your EduSarthi account was just changed, and every device was signed out.\n\nIf this was you, there is nothing to do.\n\n${ifNot}\n\nSign in: ${url}`;
  const html = `<p>The password for your EduSarthi account was just changed, and every device was signed out.</p><p>If this was you, there is nothing to do.</p><p><b>${ifNot}</b></p><p><a href="${url}">Go to sign in</a></p>`;
  await send(to, subject, text, html);
}

/// The code a guest types to make their guest account a full one. Worded so
/// that someone who never asked for it knows they can ignore it.
export async function sendGuestUpgradeCode(to: string, code: string) {
  const subject = "Your code to save your EduSarthi progress";
  const ignore = "If you did not ask for this, you can ignore this email. Nothing changes without the code.";
  const text = `Your code is ${code}. Type it in EduSarthi to make your guest account a full account with this email. It expires in 10 minutes.\n\n${ignore}`;
  const html = `
    <p>Your code to save your EduSarthi progress is:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
    <p>Type it in EduSarthi to make your guest account a full account with this email. It expires in 10 minutes.</p>
    <p style="color:#5f6773;font-size:13px">${ignore}</p>
  `;
  await send(to, subject, text, html);
}

/// A code for changing the account's email. "new" goes to the address being
/// added; "old" goes to the current one, for an account with no password, and
/// says plainly what it is for, since it may be a warning.
export async function sendEmailChangeCode(to: string, code: string, which: "new" | "old") {
  const subject = which === "new" ? "Your code to change your EduSarthi email" : "Someone asked to change your EduSarthi email";
  const lead =
    which === "new"
      ? "Type this code in EduSarthi to make this the email for your account."
      : "Someone asked to change the email on your EduSarthi account. If it was you, type this code in EduSarthi.";
  const ignore =
    which === "new"
      ? "If you did not ask for this, you can ignore this email. Nothing changes without the code."
      : "If it was not you, do not share this code with anyone. Nothing changes without it. Write to us from the Support page if it keeps happening.";
  const text = `${lead}\n\nYour code is ${code}. It expires in 10 minutes.\n\n${ignore}`;
  const html = `
    <p>${lead}</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
    <p>It expires in 10 minutes.</p>
    <p style="color:#5f6773;font-size:13px">${ignore}</p>
  `;
  await send(to, subject, text, html);
}

/// Sent to the old address once the email has changed, so an owner who did
/// not do it finds out at the address they still read.
export async function sendEmailChanged(to: string, newEmail: string) {
  const subject = "Your EduSarthi email was changed";
  const safe = newEmail.replace(/[<>&"]/g, "");
  const ifNot = "If you did not do this, write to us from the Support page right away.";
  const text = `The email for your EduSarthi account was changed to ${safe}, and every device was signed out.\n\nIf this was you, there is nothing to do.\n\n${ifNot}`;
  const html = `<p>The email for your EduSarthi account was changed to <b>${safe}</b>, and every device was signed out.</p><p>If this was you, there is nothing to do.</p><p><b>${ifNot}</b></p>`;
  await send(to, subject, text, html);
}
