# Venus TV

Android TV companion app for [Venus](https://venus-movie.vercel.app). Lets you cast whatever
you're browsing on the website straight to the TV — see `PRD.md` §13 in the repo root for the
full design (why this exists, how pairing works, why it's not real Google Cast).

## How it works

1. On first launch, the app registers itself with the backend and shows a 6-digit pairing code.
2. You enter that code once on `/tv` on the website (any browser, signed in to your account).
3. From then on, the app remembers it's paired (stored locally) and reconnects automatically on
   every future launch — no re-pairing needed.
4. While paired, the app polls the backend every 3 seconds. When you tap the cast icon on a movie
   or TV episode page, the backend records it, and the app picks it up on its next poll and opens
   a full-screen WebView pointed at a short-lived, signed viewing link.
5. Casting something new while already playing just switches — the player keeps polling in the
   background and reloads when it sees a different title.

No play/pause/seek from the phone (deliberately out of scope), and this isn't Google Cast (iOS
Safari doesn't support the Cast sender APIs at all — see the PRD for the full explanation).

## Project structure

Deliberately built with **zero third-party dependencies** beyond AndroidX core/appcompat — no
Compose, no OkHttp, no coroutines. Plain Android Views and `java.net.HttpURLConnection`. This
project was written without the ability to compile-test it locally (no Android SDK/Gradle
available in that environment), so minimizing moving parts was a deliberate choice to maximize
the odds of a clean first build.

```
android-tv/
  app/src/main/java/com/venus/tv/
    MainActivity.kt      — pairing code screen, polls for a cast command
    PlayerActivity.kt    — full-screen WebView, polls to detect "cast something else"
    ApiClient.kt          — minimal HTTP helper (java.net, no dependencies)
    DeviceStore.kt         — SharedPreferences wrapper for the persisted device token
    CastInfo.kt             — parses a poll response into a usable /tv-embed URL
```

## Building

**Locally (Android Studio):** open the `android-tv/` folder as a project, let Gradle sync, then
Run or Build > Build Bundle/APK.

**CI (automatic):** `.github/workflows/build-tv-apk.yml` builds a debug APK on every push that
touches `android-tv/**` and commits the result to `public/venus-tv.apk` in the main repo, which
Vercel then serves directly — that's what the "Download TV App" button on `/login` links to.
This workflow was written without the ability to test-run it; if a build fails, check the Actions
tab on GitHub for the log.

## Changing the backend URL

`BASE_URL` is a `buildConfigField` in `app/build.gradle.kts`, currently hardcoded to
`https://venus-movie.vercel.app`. Change it there if the site ever moves.

## Known limitations (v1)

* No play/pause/volume from the phone — the actual video lives inside a third-party VidSrc
  iframe we don't control.
* One paired TV per account.
* If the pairing code isn't entered within its ~10 minute expiry, the app doesn't currently
  auto-refresh it — relaunch the app to get a new one.
