# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-21 — Built TV casting: web side complete & verified, Android app written but unbuilt
**Context:** user said "start the project... build the whole thing first — I'll test it at the end", explicitly accepting that I can't test the Android side myself.

**First finding:** checked this environment for Android build tooling — no Java, no Gradle, no Android SDK. Can't compile or run the Android app here, unlike the website which has been fully build-and-browser-verified throughout this project. This shaped the whole approach: build the web side completely and verify it live (same as always), write the Android app as carefully and dependency-light as possible to maximize first-build odds, and set up CI to actually produce a compiled APK since local compilation isn't possible.

**Web side — built and verified end-to-end live in the browser:**
- Migration: `tv_devices` table (+ `cast_*` columns for the polling model — see deviation note below) + RLS, via the Supabase connector.
- `TV_TOKEN_SECRET` generated and added to `.env.local` (needs adding to Vercel too before this works in production).
- New API routes: `/api/tv/register` (TV self-registers, gets a device token + 6-digit pairing code), `/api/tv/pair` (web app links a code to the signed-in user), `/api/tv/status`, `/api/tv/unpair`, `/api/tv/cast` (records what to play), `/api/tv/poll` (the TV's only touchpoint — no user session, authenticates via its own device token, mints a fresh signed view token on the fly when something's cast).
- `src/lib/tvToken.ts`: HMAC-SHA256 signed view tokens, 10 min expiry.
- `/tv-embed/movie/[id]` and `/tv-embed/tv/[id]/[season]/[episode]`: stripped-down player-only pages, no header/nav. Getting the header hidden required threading the pathname through the proxy as a request header (`x-pathname`) into the root layout, since Header currently lives in the single root layout shared by every route — avoided a full route-group restructure for this one exception.
- `/tv` page: pairing code entry, or "Connected" + "Forget this TV" if already paired.
- "Cast to TV" button in `VideoPlayer.tsx` (bottom-left, mirrors the fullscreen button), only shown when paired; hidden inside the TV's own embed view via a new `showCastButton` prop.
- "Download TV App" button on `/login`, "TV" link in the header nav.
- **Verified live**: registered a fake device via curl, paired it through `/tv`, confirmed poll reflects pairing status before/after, cast a real movie and confirmed the poll response carried a valid view token, loaded `/tv-embed` with that token and confirmed the player renders with no header (while the normal movie page still has its full header — checked as a regression test), confirmed bad/missing tokens are rejected, confirmed unpair works, and ran a clean sign-out/sign-in cycle to make sure the proxy change didn't break normal auth. `npm run lint` and `npm run build` both clean.
- **Deviation from the original plan**: HTTP polling (~3s) instead of Supabase Realtime — no good lightweight Kotlin Realtime client exists without pulling in a much larger multiplatform SDK, and polling only needs the same single HTTP mechanism the Android app already needs anyway. Documented in PRD.md §13.1 and §13.5.

**Android TV app — written, not compiled or tested:**
- Full project at `android-tv/` — deliberately **zero third-party dependencies** beyond AndroidX core/appcompat. No Jetpack Compose, no OkHttp, no coroutines — plain Android Views (XML layouts) and `java.net.HttpURLConnection`. This was a deliberate risk-reduction choice: since I can't compile-test any of this, fewer moving parts (no dependency-version resolution to get wrong) means better odds the first real build actually succeeds.
- `MainActivity.kt` (pairing code + poll loop), `PlayerActivity.kt` (full-screen WebView + its own poll loop so casting something new mid-playback switches automatically), `ApiClient.kt`, `DeviceStore.kt`, `CastInfo.kt`.
- Manifest declares `LEANBACK_LAUNCHER` (required to appear on an Android TV home screen), placeholder vector-drawable banner/icon (simple geometric shapes in the site's brand colors, not real artwork).
- `android-tv/README.md` documents the whole thing for anyone opening it in Android Studio later.
- **GitHub Actions workflow** (`.github/workflows/build-tv-apk.yml`): builds a debug APK on every push touching `android-tv/**`, auto-commits it to `public/venus-tv.apk`, which Vercel then serves — this is the actual mechanism intended to produce a real, downloadable APK without any local Android tooling. **This workflow itself has never run** — I have no way to trigger or check GitHub Actions from here (no `gh` CLI, confirmed earlier this session).

**Not started yet / explicitly needs the user:**
- Check the GitHub Actions tab after this gets pushed to confirm the APK build actually succeeds. If it fails, the log will point at what's wrong (most likely a dependency or action-version issue) — share it and it gets fixed like any other bug.
- Add `TV_TOKEN_SECRET` to Vercel's environment variables (same step as the service role key earlier).
- Real end-to-end hardware testing (pairing, casting, mid-playback switching) — entirely on the user, as agreed upfront.
- Phase 11 (network/IP lockdown) remains separately, deliberately deferred.

**Next step:**
- Commit and push everything (web side + Android project + CI workflow + docs), then wait for the user to check whether the Actions build succeeds and report back.
