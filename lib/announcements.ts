// Owns announcements: an email to every account holder with a verified
// address, used for the changes the Terms and Privacy pages promise to email
// about. Drafts, the admin's test email, starting (which also posts the
// dashboard notice), stopping, and the daily batch the cron sends.
//
// Owner's decision: at most 80 a day, so the announcement and the site's own
// emails (sign-in codes, reminders) fit SendGrid's daily allowance. Each
// person's copy is recorded before it is sent, so nobody gets it twice and a
// run that dies part-way carries on the next day.
//
// It deliberately does NOT check who is calling — the admin route does — and
// does not parse requests (lib/announcementSchemas).

import { Prisma } from "@prisma/client";

import { logAdmin } from "@/lib/admin";
import { istDayStart } from "@/lib/aiLimits";
import { sendAnnouncement } from "@/lib/email";
import { prisma } from "@/lib/prisma";

type Result = { ok: true } | { error: string };

export const ANNOUNCEMENT_DAILY_LIMIT = 80;
/// How long the dashboard notice stays up after sending starts.
const NOTICE_DAYS = 30;
/// Emails in flight at once: enough to finish 80 well inside the cron's time,
/// few enough not to trip SendGrid's rate limit.
const PARALLEL = 5;

/// Everyone who can be told: an address they proved is theirs. Phone-only
/// accounts are left to the dashboard notice.
const RECIPIENTS = { email: { not: null }, emailVerified: { not: null } } satisfies Prisma.UserWhereInput;

/// The owner-approved wording for the library Terms update, offered as the
/// first draft. Links are built from the site's address, so they work in the email.
export function termsUpdateDraft(site: string) {
  return {
    subject: "EduSarthi: updated Terms and Privacy for the deck library",
    body: [
      "Hello,",
      "We have updated our Terms and our Privacy page because the flashcard deck library has new features.",
      [
        "- If you are 18 or older, you can publish your decks to the public library. Published decks are shared under CC BY-SA 4.0, show your name the way you choose, and EduSarthi may use them in paid features.",
        "- You can share a deck with named people, to view or edit it.",
        "- Institutes can publish decks under their name and logo.",
      ].join("\n"),
      "Nothing changes for you unless you choose to use these features.",
      [`Terms: ${site}/legal/terms`, `Privacy: ${site}/legal/privacy`, `Library rules: ${site}/legal/library-rules`].join("\n"),
      "You are getting this email because you have an EduSarthi account.",
    ].join("\n\n"),
    notice: "We have updated our Terms and Privacy page for the new deck library features. Nothing changes for you unless you choose to use them. Both pages are linked at the bottom of every page.",
  };
}

/// The notice for opening the library to everyone (docs/PUBLIC-LIBRARY-PLAN.md,
/// Step 4). The Privacy page promises an email before a change takes effect, and
/// this is that email. It goes to every account holder, because the tool has no
/// narrower audience; the first line after the greeting lets a reader who never
/// published a deck stop reading. The seven days are a promise the sender must
/// keep: merge the change no earlier than that after the last email goes out.
export function libraryOpenDraft(site: string) {
  return {
    subject: "EduSarthi: the deck library will be open to everyone",
    body: [
      "Hello,",
      "Soon, anyone will be able to read the EduSarthi deck library, with or without an account, and search engines such as Google may list its decks. Today only signed-in people can see it.",
      "What this means for you:",
      [
        "- If you have not published a deck to the library, nothing changes for you.",
        "- If you have published a deck, it will be readable by anyone, and search engines may list it. It shows your name only the way you chose in Settings → How your name shows on public decks, or no name.",
        "- You can change how your name shows, or withdraw a deck, at any time. A withdrawn deck leaves the library and our sitemap at once. A search engine may keep its own copy for a while, and copies people already made under CC BY-SA stay with them.",
        "- Only people with an account can follow, copy, like or report a deck.",
      ].join("\n"),
      "We will switch this on no earlier than 7 days after we finish sending this email.",
      [`Terms: ${site}/legal/terms`, `Privacy: ${site}/legal/privacy`, `Library rules: ${site}/legal/library-rules`].join("\n"),
      "You are getting this email because you have an EduSarthi account.",
    ].join("\n\n"),
    notice: "The deck library will soon be readable by anyone, signed in or not, and search engines may list it. If you have published a deck, you can change how your name shows, or withdraw it. Details are in the Terms and Privacy pages.",
  };
}

/// The first prepared draft whose subject has not been written yet, so the new
/// draft form offers the next announcement the owner still has to make, in
/// order, and a blank form once all of them have been written.
export function nextDraft(site: string, writtenSubjects: string[]) {
  return [termsUpdateDraft(site), libraryOpenDraft(site)].find((d) => !writtenSubjects.includes(d.subject)) ?? null;
}

export async function createAnnouncement(adminId: string, f: { subject: string; body: string; notice: string }): Promise<Result> {
  const a = await prisma.announcement.create({ data: { ...f, createdById: adminId }, select: { id: true } });
  await logAdmin(adminId, "Wrote announcement draft", "announcement", a.id, { subject: f.subject });
  return { ok: true };
}

export async function deleteDraft(adminId: string, id: string): Promise<Result> {
  // Drafts only: once sending starts, the deliveries are the record of who was told.
  const { count } = await prisma.announcement.deleteMany({ where: { id, startedAt: null } });
  if (!count) return { error: "Only a draft can be deleted. Refresh the page; to end one that is sending, use Stop." };
  await logAdmin(adminId, "Deleted announcement draft", "announcement", id);
  return { ok: true };
}

/// To the admin's own verified address, so they read it as a recipient will.
export async function sendTest(adminId: string, id: string): Promise<Result> {
  const [a, me] = await Promise.all([
    prisma.announcement.findUnique({ where: { id }, select: { subject: true, body: true } }),
    prisma.user.findUnique({ where: { id: adminId }, select: { email: true, emailVerified: true } }),
  ]);
  if (!a) return { error: "That announcement no longer exists. Refresh the page." };
  if (!me?.email || !me.emailVerified) return { error: "Your account has no verified email address to send the test to. Add one on your Profile page first." };
  try {
    await sendAnnouncement(me.email, `[Test] ${a.subject}`, a.body);
  } catch {
    return { error: "The test email could not be sent. Check SENDGRID_API_KEY in Vercel, then try again." };
  }
  return { ok: true };
}

export async function startAnnouncement(adminId: string, id: string): Promise<Result> {
  const busy = await prisma.announcement.findFirst({ where: { startedAt: { not: null }, finishedAt: null, id: { not: id } }, select: { subject: true } });
  if (busy) return { error: `“${busy.subject}” is still sending. Wait for it to finish, or stop it, before starting another.` };
  const now = new Date();
  const a = await prisma.announcement.findUnique({ where: { id }, select: { subject: true, notice: true } });
  if (!a) return { error: "That announcement no longer exists. Refresh the page." };
  // Same condition in the write: two admins pressing Start at once start it once.
  const { count } = await prisma.announcement.updateMany({ where: { id, startedAt: null }, data: { startedAt: now } });
  if (!count) return { error: "This announcement has already started. Refresh the page." };
  // The in-app half of the owner's decision: students see it on their dashboard.
  const notice = await prisma.notice.create({
    data: { title: a.subject, body: a.notice, createdById: adminId, expiresAt: new Date(now.getTime() + NOTICE_DAYS * 86_400_000) },
    select: { id: true },
  });
  await logAdmin(adminId, "Started announcement", "announcement", id, { subject: a.subject, notice: notice.id });
  return { ok: true };
}

/// Ends it where it is: nobody else is emailed. Those already emailed stay recorded.
export async function stopAnnouncement(adminId: string, id: string): Promise<Result> {
  const { count } = await prisma.announcement.updateMany({ where: { id, startedAt: { not: null }, finishedAt: null }, data: { finishedAt: new Date() } });
  if (!count) return { error: "That announcement is not sending. Refresh the page." };
  await logAdmin(adminId, "Stopped announcement", "announcement", id);
  return { ok: true };
}

/// Who an announcement goes to: accounts with a verified address that existed
/// when sending started (or exist now, for a draft).
function audience(startedAt: Date | null): Prisma.UserWhereInput {
  return { ...RECIPIENTS, ...(startedAt ? { createdAt: { lt: startedAt } } : {}) };
}

export async function announcementStats(a: { id: string; startedAt: Date | null }) {
  const [total, sent, failed] = await Promise.all([
    prisma.user.count({ where: audience(a.startedAt) }),
    prisma.announcementDelivery.count({ where: { announcementId: a.id, sentAt: { not: null } } }),
    prisma.announcementDelivery.count({ where: { announcementId: a.id, failed: true } }),
  ]);
  return { total, sent, failed, left: Math.max(0, total - sent - failed) };
}

/// Today's batch, run by the daily cron. Sends at most what is left of the
/// day's allowance, and stops early when `budgetMs` runs out.
export async function sendAnnouncementBatch(budgetMs: number): Promise<{ sent: number; failed: number }> {
  const started = Date.now();
  const a = await prisma.announcement.findFirst({
    where: { startedAt: { not: null }, finishedAt: null },
    orderBy: { startedAt: "asc" },
    select: { id: true, subject: true, body: true, startedAt: true },
  });
  if (!a?.startedAt) return { sent: 0, failed: 0 };
  // Counted by IST day across every announcement, so a second run on the same
  // day never goes over the allowance.
  const used = await prisma.announcementDelivery.count({ where: { createdAt: { gte: istDayStart() } } });
  const room = ANNOUNCEMENT_DAILY_LIMIT - used;
  if (room <= 0) return { sent: 0, failed: 0 };

  const people = await prisma.user.findMany({
    where: { ...audience(a.startedAt), announcementDeliveries: { none: { announcementId: a.id } } },
    orderBy: { id: "asc" },
    take: room,
    select: { id: true, email: true },
  });
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < people.length && Date.now() - started < budgetMs; i += PARALLEL) {
    await Promise.all(
      people.slice(i, i + PARALLEL).map(async (p) => {
        if (!p.email) return;
        try {
          // The claim: a second run racing this one hits the unique pair and skips.
          await prisma.announcementDelivery.create({ data: { announcementId: a.id, userId: p.id } });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return;
          throw e;
        }
        try {
          await sendAnnouncement(p.email, a.subject, a.body);
          await prisma.announcementDelivery.update({ where: { announcementId_userId: { announcementId: a.id, userId: p.id } }, data: { sentAt: new Date() } });
          sent++;
        } catch {
          // Not retried: a bad address would otherwise eat the allowance every day.
          await prisma.announcementDelivery.update({ where: { announcementId_userId: { announcementId: a.id, userId: p.id } }, data: { failed: true } });
          failed++;
        }
      }),
    );
  }
  const left = await prisma.user.count({ where: { ...audience(a.startedAt), announcementDeliveries: { none: { announcementId: a.id } } } });
  if (left === 0) await prisma.announcement.updateMany({ where: { id: a.id, finishedAt: null }, data: { finishedAt: new Date() } });
  return { sent, failed };
}
