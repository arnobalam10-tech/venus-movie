# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-21 — TV casting fully deployed: CI build fixed, APK live, download-route bug found and fixed
**Context:** continuing directly from the previous entry (web side built and verified, Android app written but unbuilt/unverified due to no local Android tooling). This entry covers getting the actual APK produced and correctly served.

**GitHub Actions build — fixed in two iterations, now succeeding:**
- Pushed the initial workflow; it failed at the `android-actions/setup-android@v3` step. Discovered this by polling the GitHub Actions REST API directly with curl — the repo is public, so run status and step-level conclusions are readable without any auth token (full logs need admin rights, which wasn't needed here since the step name alone was enough signal).
- Fix 1: removed that action entirely, added a manual `sdkmanager "platforms;android-34" "build-tools;34.0.0"` step instead, reasoning that GitHub's `ubuntu-latest` runners ship with the Android SDK preinstalled and licensed already. This also failed.
- Fix 2: removed the manual `sdkmanager` call too (likely a JDK 17 compatibility issue with older bundled cmdline-tools — a known real-world gotcha), and just let Gradle/AGP use whatever SDK components are already on the runner for a standard `compileSdk 34` build.
- **Third attempt: every step succeeded** — JDK setup, Gradle setup, the actual `gradle assembleDebug` build, copying the APK into `public/venus-tv.apk`, and the auto-commit back to the repo. Confirmed via the Actions API and by pulling the resulting commit locally (a real 3.2MB `.apk` file).

**Found and fixed a real bug while verifying the download worked:**
- The proxy's route matcher (`src/proxy.ts`) excluded image extensions from the auth check but not `.apk`, so an unauthenticated request to `/venus-tv.apk` — the whole point of the download button living on the sign-in page, for visitors who aren't logged in yet — was being redirected to `/login` instead of serving the file.
- Fixed by adding `apk` (and `csv`, catching the same latent issue for the admin panel's sample CSV download) to the matcher's excluded-extensions list.
- Verified locally first (curl with no cookies → 200 OK, correct `application/vnd.android.package-archive` content type, no redirect) before pushing, then confirmed the same thing against the live production URL after Vercel redeployed.

**Final state:** `https://venus-movie.vercel.app/venus-tv.apk` is live and downloadable by anyone, logged in or not. The `/login` page's "Download TV App" button now actually works end-to-end.

**Not started yet / needs the user:**
- Real hardware testing — download the APK to an actual Android TV (or Android TV emulator/box), install it, and run through pairing → casting → switching titles mid-playback. Entirely on the user, as agreed at the start of this feature.
- If real-device testing surfaces a bug in the Android app itself (as opposed to the build pipeline, which is now confirmed working), that becomes a normal bug-fix iteration same as anything else in this project — just needs the user to describe what went wrong.
- Phase 11 (network/IP lockdown) remains separately, deliberately deferred.

**Next step:**
- Waiting on the user to actually test the TV app on real hardware and report back.
