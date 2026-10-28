// Owns the words EduSarthi uses to explain itself: the Help page's questions,
// the Support page's common problems, and the longer notes the help chatbot
// reads (lib/aiHelp). All three read this one file, so the page and the bot can
// never disagree about how the app works.
//
// Rule for every future change: when a feature is added or changed, its help
// lines change here in the same pull request. It deliberately holds only what
// the app does today; anything planned goes in NOT_YET, never as a feature.

export const SUPPORT_EMAIL = "support@edusarthi.com";

type QA = { q: string; a: string };

export const FAQ: readonly QA[] = [
  {
    q: "How do I get my speaking audited?",
    a: "Open Practice, pick an exercise, and record or upload your answer. A teacher scores it on five skills and adds notes at exact moments in your recording. You will see it under Audited, in your notifications, and by email if that is switched on in Settings.",
  },
  {
    q: "Where do I see what is new for me?",
    a: "Tap the bell at the top of the page. It shows notices for everyone and your own news: an audit that is ready, a recording sent back, a decision about your deck, an invitation to a deck. A dot marks what you have not opened yet. Read items are removed after 90 days, unread ones after 180.",
  },
  {
    q: "Why was my recording sent back?",
    a: "A teacher can send a recording back when it cannot be audited: background noise, too quiet to hear, the wrong exercise, or an incomplete answer. The reason and tips are shown on that screen. Record again and the new attempt replaces it.",
  },
  {
    q: "How do flashcards decide what I see?",
    a: "Cards due for review come first, then new cards in order, up to your daily limit (change it in Settings). Marking a card Known pushes it further out, 1, 3, 7, 15, 30, then 60 days. Unknown brings it back sooner.",
  },
  {
    q: "What do Important, Favourite, Doubt and Confident do?",
    a: "They are your own tags on a card. Tap one on the card bar, then open it from the lists above the card to study just those. Tags do not change when a card is due.",
  },
  {
    q: "Can I make my own flashcards?",
    a: "Yes. Open Menu → My decks to make a deck, and Library to copy a public one. Public decks are checked by an admin before anyone else can see them.",
  },
  {
    q: "The text is too small on the card.",
    a: "Settings → Text size → A+. Cards also scale their text to fit the screen, and you can pinch to zoom on the first two sides.",
  },
  {
    q: "Uploads are slow on my data connection.",
    a: "Turn on Data saver in Settings. New recordings are made at a lower quality and upload faster. You can also upload a short file instead of a long one.",
  },
  {
    q: "How do I change my email or mobile number?",
    a: "Settings → Email and phone. For a new email you enter your password (or a code sent to your current address), then a code sent to the new address. Changing it signs you out on every device; sign in again with the new address. You can change your email three times in 30 days.",
  },
  {
    q: "Who can see my profile photo?",
    a: "Settings → Profile photo, or tap the circle on your Profile. A student's photo is seen only by that student; teachers know you by your student ID. A teacher's photo is shown to students on their audits after an admin checks it.",
  },
  {
    q: "I lost my phone or used a shared computer.",
    a: "Settings → Security → Sign out of all devices. Then change your password from the sign-in page with Forgot password.",
  },
  {
    q: "How do I delete my account or download my data?",
    a: "Both are on your Profile page, under your data rights. Deleting removes your recordings, audits and account and cannot be undone.",
  },
];

export const SUPPORT_ISSUES: readonly QA[] = [
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
];

/// Longer notes for the chatbot only: how each part of the app works, in the
/// words a page would use. Facts here were checked against the code.
const NOTES: readonly QA[] = [
  { q: "Finding your way", a: "On a phone the bar at the bottom has Dashboard, Flashcard, Audited, Class and Profile. The menu (three lines, top right) has Explore flashcards, Practice modules, My decks, Library, Institute, Progress and reports, History, Settings, Help and FAQ, Contact support and Install app. The magnifier at the top searches cards, the bell opens notifications and the gear opens settings." },
  { q: "Class tab", a: "Live classes and recorded video lessons are planned but do not exist yet. The Class tab says so and leads to the speaking exercises." },
  { q: "Built-in flashcards", a: "2,227 words (levels A1, A2 and B1+), chunks (useful phrases), grammar cards and customer-support English cards (voice, chat and email). Each card has three sides you turn. Mark it Known or Unknown, or add a remark. Flashcard → Sections lets you study by level, topic, word type, importance or goal (Daily English, Interviews, IELTS and exams, Work English); these goal paths are chosen by EduSarthi and are not an official exam list." },
  { q: "Flashcard settings", a: "In Settings: new cards per day (5, 10, 15, 20 or 30), hide Hindi meanings, say the word when a card opens, text size, card colour and Data saver." },
  { q: "Explore", a: "Menu → Explore flashcards lists subject decks (for example data, programming, cloud) and library decks. Import and study copies a deck into your decks and opens it." },
  { q: "Your own decks", a: "Menu → My decks. Up to 20 decks of 500 cards each. A card can have a picture and a recording (each up to 2 MB, recordings up to 60 seconds). Share a deck by link, or invite people by email to view or edit it (up to 10 people per deck); they accept in their My decks." },
  { q: "Publishing to the library", a: "A deck needs at least 3 cards and you must be 18 or older. An admin reviews every deck before others can see it. Published decks are shared under the CC BY-SA 4.0 licence with your chosen name. After approval, small text fixes go live at once; bigger changes go into a new version that is reviewed while the old one stays live." },
  { q: "AI card maker", a: "On a deck or in My decks, Make cards with AI: say what you want cards for, and add pasted text, a PDF or a photo if you like. The AI asks a few questions, then makes up to 10 cards at a time for you to check, edit or remove before adding them. Every account has 100 free AI cards in total, not per day. AI cards are marked AI-assisted, and the AI can make mistakes, so check them. Guests cannot use it, and it only appears when the AI is switched on." },
  { q: "Library", a: "Menu → Library shows decks other people published. Follow a deck to study the original and get its author's fixes (up to 50 follows), or copy it into your own decks. You can like a deck or report a problem with it." },
  { q: "Institute", a: "A school or coaching centre can have its own space on EduSarthi. Join with the code your institute gives you (Menu → Institute). Decks shared with the institute are seen only by its members." },
  { q: "Practice and audits", a: "Menu → Practice modules. Each exercise asks for audio, video or a photo of written work; record in the app or upload a file. A teacher scores pronunciation, grammar, fluency, vocabulary and confidence out of 10 and adds notes at exact moments plus a summary. Teachers see you only by your student ID. Recordings are deleted from storage 90 days after you send them; the audit stays." },
  { q: "Progress and history", a: "Menu → Progress and reports shows your score trend, how each skill moved, the week's activity and your flashcards. Menu → History lists your recordings and every card you answered, by day; you can delete your study history there." },
  { q: "Emails and reminders", a: "In Settings: 'Email me when an audit arrives' is on unless you switch it off. A daily study reminder email is off unless you switch it on; it goes out around 7 pm India time, only when cards are due. Choosing your own reminder time is not available yet." },
  { q: "Guests", a: "Continue as guest lets you study flashcards and keep your progress. Guests cannot record, get audits, make decks or use the AI card maker; create a free account (sign-up page or Continue with Google) for that." },
  { q: "Signing in", a: "Sign in with your password, a 6-digit code sent to your email (or the one-tap link in that email), or Continue with Google. Forgot password is on the sign-in page." },
  { q: "Installing", a: "Menu → Install app adds EduSarthi to your phone's home screen." },
  { q: "For teachers", a: "Queue lists recordings to audit, oldest first. Claiming one gives you 30 minutes, which you can extend or release; send it back with a reason if it cannot be audited. Recordings on a verified teacher's own library deck go only to that teacher. Students lists the students you have worked with, and Workload shows your counts." },
];

/// Asked about often enough to answer plainly: these do not exist today.
const NOT_YET = "Not available yet: live chat with a person, messaging a teacher, choosing your own reminder time, live classes and video lessons, paid plans, and the app in Hindi or Hinglish.";

const block = (title: string, items: readonly QA[]) => `## ${title}\n\n${items.map((i) => `${i.q}\n${i.a}`).join("\n\n")}`;

/// Everything above as one text for the chatbot's instructions. It changes only
/// when this file changes, so the model's cached copy stays valid between questions.
export function helpKnowledge(): string {
  return [block("Help page questions", FAQ), block("Common problems (Support page)", SUPPORT_ISSUES), block("How each part works", NOTES), `## Not available yet\n\n${NOT_YET}`, `## Contact\n\nWrite to ${SUPPORT_EMAIL} (a reply may take a day or two), or use the Support page.`].join("\n\n");
}
