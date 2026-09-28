# Uploading Speak Sarthi to GitHub

This pack contains the repository files that were **missing from every zip
delivered so far**, plus two scripts that make the upload safe.

---

## 1. Read this first — the bug this pack fixes

Every archive built earlier in this project used this command:

```
zip -rq SpeakSarthi-full.zip SpeakSarthi -x "*.git*" -x "*/build/*" ...
```

The intent of `-x "*.git*"` was "leave out the `.git` folder". But that
pattern also matches:

- `.gitignore`
- `.gitattributes`
- `.github/`

So **`.gitignore` was silently stripped out of every zip**. This was
verified, not assumed:

```
$ zip -rq old.zip proj -x "*.git*"
$ unzip -Z1 old.zip
proj/
proj/build.gradle.kts          <- .gitignore and .gitattributes are gone
```

That matters more than it sounds. The hardened `.gitignore` is the single
thing standing between you and committing `.env`, `keystore.properties`,
your **upload keystore** and the **Play service-account JSON** into a
public repository. Without it in the folder, the very first `git add -A`
would have staged all of them.

**So: whichever zip you extract, copy the `.gitignore` from this pack in
before you run any git command.** Then run `check_secrets.sh`, which proves
it worked instead of trusting it.

---

## 2. Make the repository PRIVATE

Speak Sarthi is a commercial product with an unpublished Play listing, a
1,000-word dataset you paid to build, and a paywall whose server contract
is in the repo. A public repo lets anyone clone it, change the package name
and publish a copy before you do.

Create the repo with **Private** selected. You can always flip it to public
later; you cannot un-see a public repo.

---

## 3. Fill in one line in `LICENSE`

Open `LICENSE` and replace `[YOUR FULL LEGAL NAME]` with the name you will
publish under on Google Play, then delete the note at the bottom.

The licence in this pack is **proprietary / all rights reserved** — not MIT.
MIT would let anyone legally ship your app as their own. If you ever want
contributors, that is the moment to reconsider, not now.

---

## 4. Route A — `git push` (recommended)

This is the correct way and it needs no zip at all. Run these in the project
folder (the one containing `gradlew` and `settings.gradle.kts`).

```bash
# 0. copy the three repo files in from this pack, if they aren't there
cp /path/to/github-ready/.gitignore      .
cp /path/to/github-ready/.gitattributes  .
cp /path/to/github-ready/LICENSE         .

# 1. PROVE nothing sensitive would be committed  <-- do not skip
sh /path/to/github-ready/check_secrets.sh .
#    it must print:  RESULT: PASS

# 2. set up the repo
git init
git branch -M main
git add -A
git status            # read the list once, with your own eyes

# 3. first commit
git -c user.name="Your Name" -c user.email="you@example.com" \
    commit -m "Speak Sarthi: initial commit"

# 4. connect the empty PRIVATE repo you created on github.com and push
git remote add origin https://github.com/<your-username>/speak-sarthi.git
git push -u origin main
```

If `git push` asks for a password: GitHub stopped accepting account
passwords. Create a **personal access token** (Settings → Developer
settings → Personal access tokens → Fine-grained, `Contents: Read and
write` on that one repo) and paste the token as the password.

### Is git installed?

`git --version` should print `git version 2.x`. If it prints nothing:

- **Windows** — install Git for Windows from https://git-scm.com/download/win
  (it also gives you Git Bash, which is what runs the `.sh` scripts here).
- **macOS** — `xcode-select --install`, or `brew install git`.
- **Linux** — `sudo apt install git` / `sudo dnf install git`.

---

## 5. Route B — the zip

You asked for a zip, so here is how to build a correct one:

```bash
sh /path/to/github-ready/make_github_zip.sh /path/to/SpeakSarthi
```

It copies the three repo files in if missing, runs the secret check, then
asks **Git itself** which files it would track
(`git ls-files --cached --others --exclude-standard`) and zips exactly that
set. No hand-written exclusion patterns, so the `*.git*` class of bug cannot
come back. It then re-opens the archive and fails if `.gitignore` is absent
or anything sensitive is present.

**But know this before you plan around it:** GitHub's browser uploader is
limited to **100 files at a time** and **25 MiB per file**
([GitHub Docs](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)).
This project tracks roughly 200 files, so a drag-and-drop upload needs
several batches and is easy to get half-done. Use Route A. Treat the zip as
a backup and a way to move the project between machines.

---

## 6. After your first successful Android Studio build

Two things to commit that do not exist yet:

1. **`app/schemas/`** — Room writes the schema JSON on the first successful
   build. `MigrationTest` skips itself without `app/schemas/1.json`, and
   without these files future migrations cannot be written at all. Commit
   them, and re-commit after every schema version bump. (`.gitignore` in
   this pack already protects them from the `build/` rules.)
2. **`gradle/wrapper/gradle-wrapper.properties`** — already present; just
   confirm it survived, along with `gradle-wrapper.jar`. That jar was
   hand-rebuilt from Gradle 8.14.3 during the audit and `.gitattributes`
   marks it `binary` so Git never rewrites a byte of it.

---

## 7. Never commit these

| File | Why |
|---|---|
| `*.jks`, `*.keystore`, `keystore.properties` | **A leaked upload keystore cannot be rotated.** Lose control of it and you can never update the app under that listing again. |
| `.env`, `.env.*`, `worker/.dev.vars` | Azure Speech key and Worker secrets. The Azure quota is billed to you personally. |
| `*service-account*.json` | Play Developer API key — grants publishing rights on your account. |
| `google-services.json` | Firebase/Google project config. |
| `local.properties` | Your SDK path, and the dev Azure key. `local.properties.template` is the one that gets committed. |

All of these are covered by the `.gitignore` in this pack, and
`check_secrets.sh` fails the run if any of them ever gets staged.

### If a secret does get committed

Deleting it in a later commit **does not remove it from history** — anyone
who clones still has it, and GitHub keeps the old blob reachable for a
while. The only real fix is to **rotate the secret**: new Azure key, new
service account, new `.env`. Rewriting history (`git filter-repo`) is a
second step, not a substitute.

A keystore is the exception with no fix, which is why it sits at the top of
the table.

---

## 8. Files in this pack

| File | What it is |
|---|---|
| `.gitignore` | 121 lines. Hardened in the security audit; verified by simulating `git add -A` with real secret filenames present. |
| `.gitattributes` | Pins `gradlew` to LF and `gradlew.bat` to CRLF. A CRLF `gradlew` fails on Linux and macOS with `bad interpreter: /bin/sh^M` — this is the third distinct way this project's wrapper can break, and the two others were real. |
| `LICENSE` | Proprietary, all rights reserved. One name to fill in. |
| `check_secrets.sh` | Run before every push. Asks Git what it would commit, then fails on secret-shaped names, secret-shaped content, a release build that does not blank `AZURE_SPEECH_KEY`, and staged build output. |
| `make_github_zip.sh` | Builds the GitHub-ready archive from Git's own file list, then verifies the archive. |
| `GITHUB_UPLOAD.md` | This file. |

Each check in `check_secrets.sh` was proved by injecting the fault it is
meant to catch: an uncovered `.env`, a PEM key pasted into a committed
Kotlin file, a `release` block with the `AZURE_SPEECH_KEY` override removed,
and `build/` dropped from `.gitignore`. All four failed the run; the clean
tree passes.

One deliberate exception: `worker/src/play.ts` is excluded from the content
scan. It matches PEM patterns because it *parses* PEM — it holds no key.
That false positive was identified during the audit and is annotated in the
script rather than silently filtered.
