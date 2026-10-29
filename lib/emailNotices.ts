// Owns the notices that say something is waiting: an audit for a student, due
// flashcards, a teacher's queue. Each links to the page and never quotes a
// student's work or names them: that stays behind sign-in.
//
// It deliberately does NOT decide who gets one or when; lib/notify, the daily
// jobs and lib/queueDigest do. Sending itself is lib/email's sendEmail.

import { SLA_HOURS, URGENT_WITHIN_HOURS } from "@/lib/claims";
import { sendEmail } from "@/lib/email";
import { STREAK_MIN_XP } from "@/lib/streak";

/// Tells a student their recording has been audited. Links to the audit, never
/// quotes it: scores and notes stay behind sign-in.
export async function sendAuditReady(to: string, url: string) {
  const subject = "Your teacher has returned your audit";
  const text = `Your teacher has audited your recording.\n\nOpen it here: ${url}\n\nYou get this email because "Audit returned" is on in Settings, under Email. You can switch it off there.`;
  const html = `<p>Your teacher has audited your recording.</p><p><a href="${url}">Open your audit</a></p><p style="color:#666;font-size:12px">You get this email because “Audit returned” is on in Settings, under Email. You can switch it off there.</p>`;
  await sendEmail(to, subject, text, html);
}

/// The once-a-day study nudge. Only sent when cards are actually due, so it is
/// never a "come back" email with nothing behind it. `streak` is the streak to
/// keep today (0 when there is none, or today already counts): one plain line,
/// no alarm, because a reminder that scolds gets switched off.
export async function sendStudyReminder(to: string, due: number, url: string, streak = 0) {
  const subject = `${due} flashcard${due === 1 ? " is" : "s are"} due for review today`;
  const keep = streak > 0 ? `Your ${streak}-day streak needs ${STREAK_MIN_XP} XP today, about ${STREAK_MIN_XP} reviews.` : "";
  const text = `${due} flashcard${due === 1 ? " is" : "s are"} waiting for review.${keep ? ` ${keep}` : ""}\n\nStart here: ${url}\n\nYou get this email because the daily reminder is on in Settings. You can switch it off there.`;
  const html = `<p>${due} flashcard${due === 1 ? " is" : "s are"} waiting for review.</p>${keep ? `<p>${keep}</p>` : ""}<p><a href="${url}">Start reviewing</a></p><p style="color:#666;font-size:12px">You get this email because the daily reminder is on in Settings. You can switch it off there.</p>`;
  await sendEmail(to, subject, text, html);
}

/// The evening queue email for teachers and admins. Counts only, never a
/// student's id or recording: the queue itself stays behind sign-in.
export async function sendQueueDigest(to: string, waiting: number, urgent: number, url: string) {
  const subject = `${waiting} recording${waiting === 1 ? " is" : "s are"} waiting for an audit`;
  const urgentLine = urgent > 0 ? `${urgent} of them ${urgent === 1 ? "has" : "have"} less than ${URGENT_WITHIN_HOURS} hours left before the ${SLA_HOURS}-hour deadline.` : "";
  const off = "You get this email because the daily queue email is on in Settings. You can switch it off there.";
  const text = `${subject}.\n${urgentLine ? `${urgentLine}\n` : ""}\nOpen the queue: ${url}\n\n${off}`;
  const html = `<p>${subject}.</p>${urgentLine ? `<p><b>${urgentLine}</b></p>` : ""}<p><a href="${url}">Open the queue</a></p><p style="color:#666;font-size:12px">${off}</p>`;
  await sendEmail(to, subject, text, html);
}

/// One per new recording, for a teacher or admin who asked for them. Says only
/// that something arrived and how long it has: no student, no recording.
export async function sendNewRecording(to: string, url: string) {
  const subject = "A new recording is waiting for an audit";
  const off = "You get this email because \u201cEach new recording\u201d is on in Settings, under Email. You can switch it off there.";
  const text = `A student has sent a new recording. It is in your queue, and the ${SLA_HOURS}-hour deadline has started.\n\nOpen the queue: ${url}\n\n${off}`;
  const html = `<p>A student has sent a new recording. It is in your queue, and the ${SLA_HOURS}-hour deadline has started.</p><p><a href="${url}">Open the queue</a></p><p style="color:#666;font-size:12px">${off}</p>`;
  await sendEmail(to, subject, text, html);
}
