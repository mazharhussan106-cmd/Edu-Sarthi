# Edusarthi Android app

The Android app is a **Trusted Web Activity (TWA)**: it opens the student web
app full screen in Chrome's engine. There is no separate app code. Every
screen, fix and feature ships through the website, with no Play Store update.

- Package name: `com.edusarthi.app`
- Opens: `https://<twaHost>/dashboard?source=twa` (`twaHost` is in `gradle.properties`, default `edusarthi.com`)
- Recording, uploads, sign-in and the offline page all come from the website

## How the app and the website trust each other

A TWA hides the browser bar only when both sides agree:

1. **The app** declares the site in `asset_statements` (built from `twaHost`).
2. **The site** serves `/.well-known/assetlinks.json`, built from two
   environment variables:

   | Variable | Value |
   |---|---|
   | `ANDROID_PACKAGE_NAME` | `com.edusarthi.app` |
   | `ANDROID_CERT_SHA256` | Signing certificate SHA-256 fingerprint(s), comma-separated |

Until both are set, the app still works but shows a small URL bar at the top.
The same check makes sign-in links from email open inside the app.

## Get an APK without Android Studio

Every push that touches `android/` runs the **Android app** workflow in GitHub
Actions. Open the run and download the `edusarthi-debug-apk` artifact, then
install it on a phone. A debug build shows the URL bar; that is expected.

## Build locally (Windows, PowerShell)

Install Android Studio once. It brings the JDK and the Android SDK. Then, from
the `android` folder:

```powershell
.\gradlew.bat assembleDebug
```

The APK is at `app\build\outputs\apk\debug\app-debug.apk`.

## Release build for Google Play

Step 1: create the upload key. Keep this file and its password safe and
**never commit them**. Losing the key means asking Google support to reset it.

```powershell
keytool -genkeypair -v -keystore edusarthi-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Step 2: copy `keystore.properties.example` to `keystore.properties` and fill in
the path and passwords. It is gitignored.

Step 3: build the bundle Google Play wants.

```powershell
.\gradlew.bat bundleRelease
```

It is at `app\build\outputs\bundle\release\app-release.aab`.

Step 4: upload it in Play Console (start with **Internal testing**). Play
re-signs the app with its own key.

Step 5: in Play Console go to **Setup → App integrity → App signing** and copy
the **SHA-256 certificate fingerprint** of the app signing key. Put it in
`ANDROID_CERT_SHA256` on Vercel and redeploy. To also verify your locally
signed builds, add the upload key's fingerprint after a comma:

```powershell
keytool -list -v -keystore edusarthi-upload.jks -alias upload
```

Step 6: check it at
`https://edusarthi.com/.well-known/assetlinks.json`: it must list the package
name and the fingerprint(s).

## Play Store listing assets

- App icon 512×512: `play-store-icon-512.png`
- Screenshots: take them from the app on a phone
- Privacy policy URL: `https://edusarthi.com/legal/privacy` (still a draft that
  needs a lawyer before launch)

## Things to know

- **Chrome is required.** Phones without Chrome (or another TWA-capable
  browser) open the site in a normal browser tab instead.
- **Microphone permission** is asked by Chrome the first time a student
  presses Record, not at install.
- **Version bumps:** raise `versionCode` in `app/build.gradle.kts` before each
  Play upload. Website changes need no bump.
