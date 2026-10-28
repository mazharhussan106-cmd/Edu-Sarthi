// Owns the emails about changes to an account: the codes that prove an inbox
// (a guest keeping their progress, changing the email) and the notices after
// a password or email changes.
//
// It deliberately does NOT decide when to send; the profile routes do, after
// their own checks. Sending itself is lib/email's sendEmail.

import { sendEmail } from "@/lib/email";

/// Sent after a password is changed from Settings. Every session has already
/// ended, so if this was not the owner, Forgot password is the way back in.
export async function sendPasswordChanged(to: string, url: string) {
  const subject = "Your EduSarthi password was changed";
  const ifNot = "If you did not do this, use Forgot password on the sign-in page now to set a new one, then write to us from the Support page.";
  const text = `The password for your EduSarthi account was just changed, and every device was signed out.\n\nIf this was you, there is nothing to do.\n\n${ifNot}\n\nSign in: ${url}`;
  const html = `<p>The password for your EduSarthi account was just changed, and every device was signed out.</p><p>If this was you, there is nothing to do.</p><p><b>${ifNot}</b></p><p><a href="${url}">Go to sign in</a></p>`;
  await sendEmail(to, subject, text, html);
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
  await sendEmail(to, subject, text, html);
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
  await sendEmail(to, subject, text, html);
}

/// Sent to the old address once the email has changed, so an owner who did
/// not do it finds out at the address they still read.
export async function sendEmailChanged(to: string, newEmail: string) {
  const subject = "Your EduSarthi email was changed";
  const safe = newEmail.replace(/[<>&"]/g, "");
  const ifNot = "If you did not do this, write to us from the Support page right away.";
  const text = `The email for your EduSarthi account was changed to ${safe}, and every device was signed out.\n\nIf this was you, there is nothing to do.\n\n${ifNot}`;
  const html = `<p>The email for your EduSarthi account was changed to <b>${safe}</b>, and every device was signed out.</p><p>If this was you, there is nothing to do.</p><p><b>${ifNot}</b></p>`;
  await sendEmail(to, subject, text, html);
}

/// The code a guest types to add their guest progress to the account this
/// address already has. Says what it does, so the account's owner, if it was
/// not them, knows nothing happens without it.
export async function sendGuestMergeCode(to: string, code: string) {
  const subject = "Your code to add guest progress to your EduSarthi account";
  const ignore = "If you did not ask for this, you can ignore this email. Nothing changes without the code.";
  const text = `Your code is ${code}. Type it in EduSarthi to add the flashcards you studied as a guest to the account for this email. It expires in 10 minutes.\n\n${ignore}`;
  const html = `
    <p>Your code to add your guest progress to your EduSarthi account is:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
    <p>Type it in EduSarthi to add the flashcards you studied as a guest to the account for this email. It expires in 10 minutes.</p>
    <p style="color:#5f6773;font-size:13px">${ignore}</p>
  `;
  await sendEmail(to, subject, text, html);
}
