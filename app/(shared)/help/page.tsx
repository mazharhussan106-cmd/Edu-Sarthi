// Owns the Help page: plain answers to what a student actually asks, each one
// describing what the app does today.
//
// It deliberately promises nothing that does not exist. There is no live chat
// and no teacher messaging, so the page says where questions go (Support) and
// does not invent a faster channel.

import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/Card";

export const metadata = { title: "Help — EduSarthi" };

const FAQ = [
  {
    q: "How do I get my speaking audited?",
    a: "Open Practice, pick an exercise, and record or upload your answer. A teacher scores it on five skills and adds notes at exact moments in your recording. You will see it under Audited, and by email if that is switched on in Settings.",
  },
  {
    q: "Why was my recording sent back?",
    a: "A teacher can send a recording back when it cannot be audited: background noise, too quiet to hear, the wrong exercise, or an incomplete answer. The reason and tips are shown on that screen. Record again and the new attempt replaces it.",
  },
  {
    q: "How do flashcards decide what I see?",
    a: "Cards due for review come first, then new cards in order. Settings has a daily limit for each: New cards per day, and Reviews per day (no limit unless you set one; past it, due cards wait for the next day). Marking a card Known pushes it further out: 3, 7, 15, 30, 60, 120, then 180 days. Unknown brings it back two steps sooner, but never in less than 3 days, and shows it once more a few cards later as practice, which is not saved.",
  },
  {
    q: "How do XP, streaks and stages work?",
    a: "You earn XP for practice, never for marks: 2 XP for a new card, 1 XP for reviewing a card (once per card a day, deck cards too) and 10 XP for each recording you send. A day counts for your streak when you earn 10 XP, India time. The ring on the Dashboard is your daily goal (40 XP unless you change it), and the weekly goal is how many days a week you fill it; set both in Settings → Flashcards. Tap the streak or XP on the Dashboard to see your month and every XP rule. A streak freeze covers a day you miss, by itself: you start with one, earn one each week you meet your weekly goal, and can hold two. XP adds up to stages: Stage 2 at 100 XP, Stage 5 at 1,000. Card XP counts from late October 2026, when study history began. Deleting your study history (History page) also removes the XP and streak days your card answers earned; recordings keep theirs.",
  },
  {
    q: "What do Important, Favourite, Doubt and Confident do?",
    a: "They are your own tags on a card. Tap one on the card bar, then open it from the lists above the card to study just those. Tags do not change when a card is due.",
  },
  {
    q: "Can I make my own flashcards?",
    a: "Yes. Open Menu → My decks to make a deck, and Library to copy a public one. Public decks are checked by an admin before anyone else can see them, and then anyone can read them, with or without an account.",
  },
  {
    q: "The text is too small on the card.",
    a: "Settings → Appearance → Text size → Larger (A+). Cards also scale their text to fit the screen, and you can pinch to zoom on the first two sides.",
  },
  {
    q: "Uploads are slow on my data connection.",
    a: "Turn on Data saver in Settings, under Recordings. New recordings are made at a lower quality and upload faster. You can also upload a short file instead of a long one.",
  },
  {
    q: "How many recordings can I send for audit?",
    a: "A few a day, so teachers can audit everyone's on time; the practice page shows how many you have left today. A new recording that a teacher asked for when sending one back does not count. The count starts again at midnight India time. Flashcards have no limit.",
  },
  {
    q: "I lost my phone or used a shared computer.",
    a: "Settings → Account & security → Change password. That also signs you out on every device. If you sign in with an email code or Google, use Sign out of all devices there instead.",
  },
  {
    q: "How do I change my email?",
    a: "Settings → Account & security → Change email. We send a code to the new address, and ask for your password (or send a second code to your current address if you have no password). Then you sign in again with the new address.",
  },
  {
    q: "How do I delete my account or download my data?",
    a: "Both are on your Profile page, under your data rights. Deleting removes your recordings, audits and account and cannot be undone.",
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Help</h1>
      <p className="mt-1 text-sm text-ink-muted">Short answers about how EduSarthi works today.</p>

      <div className="mt-6 flex flex-col gap-3">
        {FAQ.map((f) => (
          <details key={f.q} className="group rounded-xl border border-border bg-surface p-4">
            <summary className="cursor-pointer list-none font-display text-sm font-bold text-ink marker:hidden">{f.q}</summary>
            <p className="mt-2 text-sm text-ink-muted">{f.a}</p>
          </details>
        ))}
      </div>

      <Card className="mt-6">
        <CardTitle>Still stuck?</CardTitle>
        <p className="mt-2 text-sm text-ink-muted">
          There is no live chat. Write to us from the <Link href="/support" className="font-medium text-accent hover:underline">Support page</Link> and say which screen you were on. Questions about a specific audit are best answered by re-recording the exercise and comparing the two.
        </p>
      </Card>
    </main>
  );
}
