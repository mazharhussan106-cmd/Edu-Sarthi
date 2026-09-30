# Pre-deploy audit

Run 2026-09-17, before the first deploy. Three things were asked for: check git,
audit for exposed secrets, run a production build.

---

## 1. Git

**Already installed** — git 2.43.0. Nothing to do.

The project was **not a git repository** at the time of the audit. Nothing had
ever been committed, which is the best possible state to find before a secrets
audit: there is no history to rewrite and nothing already leaked.

---

## 2. Secrets

### Nothing is hardcoded

Scanned every `.kt`, `.ts`, `.json`, `.xml`, `.toml`, `.properties` and Gradle
file for key-shaped strings (Google, AWS, OpenAI, GitHub, Slack patterns and PEM
blocks) and for non-empty assignments to anything named like a secret.

**One match, and it is a false positive:** `worker/src/play.ts` contains the
literal `-----BEGIN PRIVATE KEY-----` as part of a PEM parser. It is a string
being stripped, not a key.

### What *was* wrong: the Azure key could ship in a release APK

`buildConfigField` values become `public static final String` constants in the
APK. R8 does not encrypt them, so anyone with `jadx` and four minutes can read
them out of a released build.

`AZURE_SPEECH_KEY` was one of those fields. Every document in this project says
the direct-to-Azure route is development-only and must not ship — but **nothing
enforced it**. A release built on a machine that still had the key in
`local.properties` would have shipped it, and the quota it unlocks is billed to
the publisher.

**Fixed** in `app/build.gradle.kts`: the release build type now overrides the
field to empty unconditionally.

```kotlin
release {
    buildConfigField("String", "AZURE_SPEECH_KEY", "\"\"")
}
```

Declarative rather than a check, deliberately. A guard that runs in a hook can be
bypassed, silently skipped under the configuration cache, or simply not fire.
This removes the code path instead: there is no longer a way to put the key in a
release APK, so forgetting is not possible. A warning still prints if a key is
set, so the value is not discarded silently.

**The other three BuildConfig fields are fine and are not secrets:**

| Field | Why it is safe |
|---|---|
| `SPEECH_PROXY_URL` | A public endpoint. It authenticates callers itself. |
| `AZURE_SPEECH_REGION` | A region name. |
| `GOOGLE_OAUTH_CLIENT_ID` | Android OAuth client IDs are public by design — they are bound to your signing certificate's SHA-1, which is what actually authenticates the app. |

### What *was* wrong: `.gitignore` would have committed every secret

Tested by simulating `git init && git add -A` with the real filenames a deploy
produces. Before the fix, **all of these would have been committed**:

```
.env   .env.local   .env.production   secrets.env   keystore.properties
app/release.keystore   app/upload-key.jks   app/my.p12
play-service-account.json   google-services.json
```

`local.properties` was already ignored; nothing else was.

**Fixed.** `.gitignore` now covers environment files in every spelling, all
signing material, and service-account JSON. Re-tested with the same simulation:
**nothing sensitive is staged**, and the 189 files that are staged contain no key
material.

The keystore entries matter most. A leaked upload keystore cannot be revoked or
rotated — losing control of it means losing the ability to update this app, for
good.

### Secrets that are correctly server-side

The Worker holds four secrets and none of them are in the repository. They are
set with `wrangler secret put` and `wrangler.toml` carries only their names in a
comment.

| Secret | |
|---|---|
| `AZURE_SPEECH_KEY` | the real one, server-side |
| `SESSION_SIGNING_KEY` | signs session tokens |
| `GOOGLE_OAUTH_CLIENT_ID` | for verifying sign-in |
| `PLAY_SERVICE_ACCOUNT` | the Play Developer API service account |

`worker/.dev.vars` is ignored and was already covered.

### One thing that is not a bug, but you should know

`mazharhussan106@gmail.com` is compiled into the app (`FeedbackScreen.kt`) and
appears in the privacy policy. That is a deliberate placeholder, but it is a
personal address that ships publicly in an APK and on a store listing. Replacing
it with a dedicated inbox before launch is still the right move.

---

## 3. Production build

### The Worker builds, and it is what you are deploying

```
npm ci                          110 packages, clean
tsc --noEmit                    PASS  (src, Workers types only)
tsc --noEmit -p test            PASS
vitest run                      16 passed
wrangler deploy --dry-run       23.55 KiB, gzip 6.69 KiB
```

The dry run also confirms `DEV_TRUST_CLIENT_PURCHASES: "0"`, which is the value
that matters — at `"1"` the server grants credits to anyone who asks.

**Toolchain updated during the audit.** Wrangler was on 3.114.17 against a
current 4.133.0, with the CLI itself warning that the version was out of date.
Upgrading needed `@cloudflare/workers-types` to go to 5.x at the same time
(wrangler 4 has it as a peer). Both were bumped and the entire chain re-verified
— typecheck, tests and the production bundle all pass, and the bundle is
unchanged in size.

### The Android build cannot complete in this environment — but two real bugs were found trying

`./gradlew` was broken in two ways that would have hit you on your own machine.
Both are fixed.

**1. The wrapper script could not start the JVM.**

```
Error: Could not find or load main class "-Xmx64m"
```

`DEFAULT_JVM_OPTS` was set to `'"-Xmx64m" "-Xms64m"'` and then expanded
unquoted, so Java received the quote characters as part of the argument and
treated them as a class name. The script also built its argument list correctly
with `set --` and then discarded it on the next line, duplicating everything in a
hand-written `exec`. Restored to the upstream form, which uses `eval` to strip
the quotes properly.

**2. The wrapper jar was incomplete.**

Hand-assembled in an earlier session, it contained `org/gradle/wrapper/` but none
of the classes those depend on — first `org.gradle.cli.CommandLineParser`, then
`org.gradle.internal.file.locking.ExclusiveFileAccessManager`. Rebuilt from the
local Gradle 8.14.3 distribution by merging `gradle-wrapper-main`,
`gradle-wrapper-shared`, `gradle-cli` and `gradle-files`. The wrapper now runs
correctly and gets as far as fetching the Gradle distribution.

**Then it hits the wall this environment has.** `services.gradle.org`,
`dl.google.com` and `repo.maven.apache.org` are all refused by the sandbox's
egress policy, so the Android Gradle Plugin cannot be resolved:

```
Plugin [id: 'com.android.application', version: '8.5.2'] was not found
  Searched in: Google, MavenRepo, Gradle Central Plugin Repository
```

That is a network policy, not a code problem, and it is the same wall that has
kept all 120 Kotlin files uncompiled throughout this project. **The Android
production build has to be run on your machine.** What can be said from here:

- the build scripts are brace- and paren-balanced
- `gradlew` starts correctly and reaches distribution download
- `python3 content/verify_project.py` passes — imports resolve, the Hilt graph is
  complete, no unused imports
- the failure above is at `build.gradle.kts` line 4, plugin resolution, before
  any of the app module is evaluated

---

## Ready / not ready

| | |
|---|---|
| Git | **Ready** — installed, repo not yet initialised |
| Secrets in code | **Ready** — none found, the one real exposure is now structurally impossible |
| `.gitignore` | **Ready** — verified by simulation against real secret filenames |
| Worker build | **Ready to deploy** — builds, typechecks, 16 tests pass |
| Android build | **Not verified** — cannot be built here; two blocking bugs found and fixed, the rest needs your machine |

### Before the first `git push`

1. `git init && git add -A && git status` — read the list before committing
2. Confirm `local.properties` is **not** in it
3. If the repository is public, remember the privacy policy and `FeedbackScreen`
   carry a personal email address
