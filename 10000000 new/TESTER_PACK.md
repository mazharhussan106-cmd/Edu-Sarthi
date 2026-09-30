# The 12 testers

This is the longest pole in the whole project and the only part that does not
care how fast you work. Everything else can be done in an evening; this takes
fourteen days of calendar time, minimum, and it cannot start until there is a
build to install.

Start recruiting **now**, before the app compiles. Finding twelve people who
will actually follow through takes longer than people expect.

---

## What Google actually requires

A personal Play Console account created after 13 November 2023 must run a closed
test with **at least 12 testers, opted in continuously for at least 14 days**,
before production access is even available. After that you apply, and Google
reviews it in about a week.

Three details that catch people out:

**"Opted in" is not "installed".** A tester counts once they have accepted the
invite and joined the test through the opt-in link. Installing the APK by hand
does nothing.

**"Continuously" means the count must hold for the whole 14 days.** If someone
opts out on day 9, you are below twelve, and the clock does not simply pause —
recruit **more than twelve** so one person changing their phone does not cost
you two weeks.

**Each tester needs their own Google account**, and it must be the account their
device actually uses. A second account someone has signed out of does not count.

**Aim for 15–16 people.** Twelve is the floor, not the target.

---

## The message to send

Short, honest, and clear about the ask. Long messages get ignored.

```
Hi — I've built an app for learning spoken English and I need 12 people
to help me test it before Google will let me publish it.

What it needs from you:
1. Tap a link and join the test (1 minute)
2. Install the app
3. Leave it installed for 14 days

That's genuinely it. You don't have to use it daily or send me anything.
If you do try it and something feels broken or confusing, tell me — that's
a bonus, not the requirement.

The only thing that would actually hurt is uninstalling before the 14 days
are up, because Google counts continuously and I'd have to start again.

Can I add you? I just need the Gmail address your phone uses.
```

### If they ask what the app is

```
It's called Speak Sarthi. You learn the 1,000 most useful English words and
practise saying them out loud — the app listens and tells you which sounds
to work on. Works offline except for the pronunciation scoring.
```

### The follow-up on day 1, after they join

```
You're in, thank you. Two things:

- Please don't uninstall for 14 days (until <DATE>). That's the bit Google
  counts.
- If anything crashes or looks wrong, screenshot it and send it over.

That's all. I'll tell you when the 14 days are done.
```

---

## Tracking it

Fourteen days is long enough to lose track. `tools/testers.csv` is a starting
table — keep it somewhere you will actually look.

| Column | Why |
|---|---|
| `name` | who |
| `gmail` | the account on their phone, which is what you add in Play Console |
| `asked` | date you asked |
| `opted_in` | date they joined — **this is the date the clock starts for them** |
| `confirmed_installed` | you saw it, or they said so |
| `day14` | opted_in + 14 |
| `notes` | phone model is worth having; a crash on one cheap phone is the most useful bug report you will get |

**Check the opt-in count in Play Console every few days.** If it drops below
twelve you want to know on the day, not on day fourteen.

---

## What to actually ask them to look at

They are not obliged to use it. But if some will, these are the things most
likely to be wrong and hardest for you to find alone:

- **Does the microphone work on their phone?** Cheap Android phones vary
  enormously here, and recording is the whole app.
- **Does scoring feel fair?** This is the one that matters most. If a tester who
  speaks clearly is told they are not clear, the band thresholds are wrong —
  see Phase 6 in [ROADMAP.md](ROADMAP.md).
- **Is anything unreadable?** Small screens, large font settings, bright
  sunlight.
- **Did the app lose their progress?** Anything here is serious and worth
  chasing immediately.

Ask them to send a screenshot rather than describe it. A description of a layout
bug is almost never enough to find it.

---

## While the clock runs

The fourteen days are not dead time. This is when to do the things that do not
block the build:

- Phase 6 — put twenty real recordings through the service and check the bands
- Phase 5 — generate the artwork
- Phase 7 — finish the privacy policy and get it read
- Watch the Azure bill daily; twelve real people scoring real audio is the first
  honest signal about what this costs

And fix what the testers find. A bug found on day three by one of twelve people
is worth more than anything you will catch by yourself.
