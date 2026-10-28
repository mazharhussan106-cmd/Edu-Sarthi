# EduSarthi — feature map (what exists and where it shows)

Written 28 Oct 2026 from the code on branch `claude/practical-ritchie-w4vnex` (each page's header comment, `lib/studentNav.ts`, `lib/staffNav.ts`). It lists what is **built**, not what is planned. If a page is added or moved, update this file in the same change.

How to read "Where": **Bar** = the bottom bar on phones (the header row on a computer). **Menu** = the ☰ button, top right: "Install the app" on top, then folding groups (every group starts closed; tap a name to open it) — 📌 Main pages (phone only), 📅 Today's tasks, 📖 Learn and practise, ✏️ Create flashcards, 🗂️ My card lists, 🤝 Shared and library decks, 👤 My account and progress, ❓ Help and support, ℹ️ About and policies — then Sign out. **Gear** = the ⚙ settings button in the header. **Search** = the 🔍 in the header.

## Student

### Home and today

| Feature | What it does | Where |
|---|---|---|
| Dashboard | One "do this next" card, streak and today's goal, cards due / new / to re-record, notices, recordings with a teacher, latest audit, score trend, what to work on, card progress, this week, recent activity | Bar → Dashboard (`/dashboard`) |
| Today's review | Due and new cards left for Words, Chunk, Grammar and Support; decks with cards due; recordings to redo and waiting for audit | Menu → Today's tasks → Today's review (`/today`) |
| Waiting for audit | Recordings sent but not audited yet (Pending + In review) | Menu → Today's tasks → Waiting for audit (`/feedback?f=review`) |
| Notices | Classes, deadlines and announcement lines an admin posted; upcoming events first | Menu → Today's tasks → Notices (`/notices`); first five also on the Dashboard |

### Flashcards

| Feature | What it does | Where |
|---|---|---|
| Daily cards | 2,227 words, 1,183 chunks, 247 grammar cards, 180 customer-support cards on the one EduSarthi card (three sides, Known / Unknown / Remark, Day 1·3·7·15·30·60 review) | Bar → Flashcard (`/flashcards`), tabs Words / Chunk / Grammar / Support |
| Chunk types | Frames, prepositions and the other chunk groups | Flashcard → Chunk tab, second row |
| Customer-support English | Voice / Chat / Email × Basic / Intermediate / Advanced | Flashcard → Support tab; Menu → Learn and practise → Customer-support English |
| Word sections | Words by level, topic, word type, importance and goal (Daily English, Interviews, IELTS and exams, Work English), in packs of 50 | Flashcard → Words → 📂 Sections; Menu → Learn and practise → Word sections (`/flashcards/sections`) |
| Remark lists on one tab | ⭐ Important, ❤️ Favourite, ❓ Doubt, 💯 Confident for the open tab | Flashcard → chips in the top row |
| My card lists | Ten lists across every kind of card and every deck you can open — Remarks: ⭐ Important, ❤️ Favourite, ❓ Doubt, 💯 Confident, 📝 My notes; Answer: ✅ Known, 🔁 Unknown; Level (of Known cards): 🔴 Hard, 🟡 Medium, 🟢 Easy. Each card shows all its marks; tap it to open the card and change them | Menu → 🗂️ My card lists → any list (`/my-cards?list=…`) |
| Study this list | Go through every card of one list (e.g. only 🔴 Hard) one at a time on the usual EduSarthi card: Known / Unknown / Remark, › to move on, ‹ to go back, End to stop; a page says when the list is done | My cards → ▶ Study this list (`/my-cards/study?list=…`) |
| Search | Find a card by word or code; recent searches; search inside a section | Search (`/search`) |
| Explore | Every kind of card, and approved library decks by subject, one tap to follow | Menu → Learn and practise → Explore flashcards (`/explore`); Flashcard → 🧭 Explore |
| Record yourself | Say (or, for support emails, write and photograph) the card for a teacher's audit | On a card |

### Decks and library

| Feature | What it does | Where |
|---|---|---|
| My decks | Your own decks, with cards due; open one to study or edit it | Menu → Create flashcards → My decks (`/decks`); Flashcard → 📚 My decks |
| New deck | Name, description and tags for a new deck (up to 20 decks); not for guests | Menu → Create flashcards → New deck (`/decks#new-deck`) |
| Make cards with AI | Say what the cards are for, answer a few questions, check the cards, add them. 100 AI cards per account in total. Shown only when the AI key is set; not for guests | Menu → Create flashcards → Make cards with AI (`/decks#ai-cards`) |
| Inside one deck | Add, edit or delete cards (front, back, example, notes, picture, recording), chapters, Study, share link on/off, People (invite to view or edit), submit to the library or withdraw, small fix and new version once published, delete the deck | My decks → open the deck (`/decks/<id>`) |
| Shared with me / Invitations | Decks people shared with you by name, to view or edit; invitations to accept | Menu → Shared and library decks → Shared with me (`/decks?shared=1#shared-with-me`) |
| Decks I follow | Library decks you study as their authors keep them (up to 50) | Menu → Shared and library decks → Decks I follow (`/decks?following=1#following`) |
| Library | Approved public decks: search, tags, like, report, copy, follow and study; record yourself on a verified teacher's deck | Menu → Shared and library decks → Library (`/library`) |
| Institute | Join with a code or apply; institute decks, members, logo, decks published under the institute's name | Menu → Shared and library decks → Institute (`/institute`) |
| How my name shows on public decks | Full name, first name, a display name or no name, on decks you publish; not for guests | Menu → My account and progress → How my name shows on public decks (`/settings#public-name`) |
| Share link page | Anyone with a deck's link can read it and copy it | `/d/<link>` (signed out too) |

### Speaking practice and audits

| Feature | What it does | Where |
|---|---|---|
| Practice modules | Speaking exercises by level; record or upload audio, video or a photo | Menu → Learn and practise → Practice modules (`/modules`); Bar → Class leads there too |
| Audited (My audits) | Every recording with its status: All / In review / Action needed / Completed | Bar → Audited (`/feedback`) |
| One audit | Rubric scores, timestamped notes, or the reason it was sent back and tips to re-record | Audited → tap a row (`/feedback/<id>`) |
| Class | Says honestly that live classes are not built yet; leads to the speaking exercises | Bar → Class (`/class`) |

### You

| Feature | What it does | Where |
|---|---|---|
| Profile | Name, level, goal, badges, practice totals, password | Bar → Profile (`/profile`) |
| Download or delete my data | DPDP export, delete account | Menu → My account and progress → Download or delete my data (`/profile#your-data`) |
| Progress and reports | Score trend, rubric first-to-latest, the week, flashcards, every audit | Menu → My account and progress → Progress and reports (`/progress`) |
| History | Practice (recordings and audits) and Study (every card answer, by day); delete study history | Menu → My account and progress → History (`/history`) |
| Settings | Theme, text size, new cards per day, hide Hindi, say the word on open, data saver, audit-ready email, daily reminder email, card colour, how your name shows on public decks, sign out of all devices | Gear (quick panel) or Menu → My account and progress → Settings (`/settings`) |
| Share EduSarthi | Phone share sheet, WhatsApp, copy link | Menu → My account and progress → Share EduSarthi (`/settings#share`) |
| Install the app | Add EduSarthi to the home screen: where the browser offers it (Android Chrome) the install box opens; otherwise the steps show (iPhone: Share → Add to Home Screen; others: browser menu ⋮). Hidden only once the app is installed | Menu → top, always |
| Sign out | Sign out on this device | Menu → bottom, or Gear → Sign out |

### Help and about

| Feature | Where |
|---|---|
| Help and FAQ | Menu → Help and support → Help and FAQ (`/help`) |
| Contact support (fixes for microphone, upload and sign-in problems, then a way to reach a person) | Menu → Help and support → Contact support (`/support`) |
| About, Terms, Privacy, Library rules | Menu → About and policies; also the footer of every page |

## Teacher

Header row (☰ on phones): **Queue** (claim and audit recordings, 24-hour SLA), **Students** (roster and each student's dossier and history, by anonymous ID), **Workload** (audits per day, SLA, turnaround), **Decks** (teacher decks with video, teacher's guide, library submission), **Institute**. The audit page (`/review/<id>`) has the rubric, timestamped notes, Send back, and the AI draft when the AI keys are set.

## Admin

Header row (☰ on phones): **Overview**, **Dispatch** (every submission, reassign, unlock), **Content** (speaking modules and exercises, CSV import), **Decks** (library review queue, reports, small fixes to check), **Institutes** (applications, logos), **Notices**, **Announcements** (email to every account plus a dashboard notice), **Import** (56-field Excel decks), **Users** (roles, suspend, history), **Compliance** (recording retention, data requests, admin log), plus **Queue** and **My decks**.

## Not built (so it shows nowhere)

Live classes and video lessons, in-app notification inbox with read/unread, payments and paid plans, a Hindi or Hinglish interface, teacher–student messaging, profile photo.
