# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-21 — Root-caused and fixed the "stuck on Connected, nothing plays" bug: polling was tied to onPause/onResume
**Context:** first WebView cookie/UA fix (previous entry) didn't resolve the actual symptom — user re-tested, still stuck on the "Connected" screen after casting.

**Diagnosis (this time backed by direct DB evidence, not just reasoning from the symptom):**
- Queried the live `tv_devices` table directly via SQL while the user retested. Initially found no new pairing/cast at all on two checks — a red flag — so asked for the exact live pairing code to pin down the right row.
- With the correct code (201403), confirmed via SQL that pairing succeeded, and after the user cast again (checkmark shown client-side), confirmed `cast_media_type`/`cast_tmdb_id`/`cast_season`/`cast_episode`/`cast_issued_at` were all correctly written server-side within ~2 minutes of the user's action.
- This proved pairing, casting-from-web, and server-side storage were all working. The only remaining unknown was whether the TV app's poll loop was actually running to notice the new cast.
- Root cause: both `MainActivity` and `PlayerActivity` started polling in `onResume()` and stopped it in `onPause()`. myandroid.org (the sandbox the user is testing on) hosts the emulator inside a browser tab — switching tabs to go browse-and-cast very plausibly triggers a real `onPause()` on the emulated app, which would silently kill the poll loop right when a cast is most likely to arrive.

**Fix (commit `87816b5`):**
- Rewrote both Activities so polling starts once in `onCreate()` and only stops in `onDestroy()` — it now runs for the Activity's full lifetime instead of being tied to foreground/background transitions.
- Also fixed a related, separate architectural gap found while in this code: [src/app/api/tv/pair/route.ts](src/app/api/tv/pair/route.ts) never enforced "one paired TV per account" — re-pairing a second device could orphan the first (still shows "Connected" on its own screen, but `/api/tv/cast` always targets the most-recently-paired device, so the orphaned one would never receive a cast again). Added a delete-other-devices-for-this-user step before finalizing a new pairing. (DB evidence showed this was NOT what caused the reported bug — only one device row ever existed per session — but it's a real gap worth closing regardless.)

**Shipped and verified:**
- `npm run lint` / `npm run build` clean before pushing.
- Monitored the triggered CI build (run `35546928705`) via the public GitHub Actions API to `"conclusion": "success"`, then polled the production APK URL until `Last-Modified`/`Content-Length` reflected the new build. Confirmed live.

**Not started yet:**
- User has not yet re-tested this specific fix — waiting on their next report.
- Still unconfirmed whether `TV_TOKEN_SECRET` was added to Vercel's environment variables (needed there, not just `.env.local`, for the mounted view-token system to work in production — flagged previously, never explicitly confirmed done).
- Phase 11 (network/IP lockdown) remains separately, deliberately deferred.

**Next step:**
- Waiting on the user to re-download the APK and re-test pairing → casting on myandroid.org (or real Android TV hardware). If still broken, the player's error-overlay text (added in the previous fix) should now at least say *why*, which will narrow the next hypothesis considerably faster than guessing blind.

### 2026-09-21 — First real-device feedback on TV casting: fixed a likely WebView cookie bug
**Context:** user tested the APK via an online Android sandbox (myandroid.org). Pairing worked cleanly ("connects nicely"), but nothing played after casting.

**Diagnosis (couldn't reproduce directly, reasoned from the symptom):**
- `PlayerActivity`'s WebView never enabled third-party cookies. Android WebView blocks these by default. Our `/tv-embed` page itself is first-party (our own domain), but the VidSrc player embedded inside it is a cross-origin iframe — and free, ad-supported video embeds like VidSrc commonly need cookies to actually initialize. This matches the symptom exactly: pairing/API calls (plain HTTP, no cookies involved) worked fine, but the WebView-rendered player didn't.
- Also swapped the WebView's user agent for a standard desktop/mobile Chrome UA instead of the default WebView identity — ad-supported embeds often specifically detect the WebView UA's `; wv)` marker and serve a degraded or broken experience to it, separate from the cookie issue.
- The player previously had no `WebViewClient` at all, meaning zero visibility into load failures — any problem just showed as a blank screen with no clue why. Added one with visible "Loading…" / error text, so future issues (including whatever might still be wrong) are actually diagnosable instead of a silent blank screen.

**Shipped and verified the pipeline end-to-end again:**
- Pushed the fix, which auto-triggered the CI build (this time succeeding on the very first attempt — confirms the build pipeline fixed last session is genuinely reliable now, not a fluke).
- Pulled the new commit locally, confirmed the resulting `public/venus-tv.apk` changed (new size/timestamp).
- Polled production until Vercel redeployed, confirmed the live APK matches the new build.

**Flagged to the user for context, not a blocker:** myandroid.org is a generic browser-based Android sandbox, not a real Android TV device — video codec/GPU passthrough is one of the least reliable things in that kind of environment, so some of what looked broken there might never have been fixable from our side regardless. Real hardware (an actual Android TV box/device) will be a more representative test.

**Not started yet:**
- Real hardware test of this fix — still on the user.
- If the cookie/UA fix doesn't fully resolve it, the new error-visibility overlay should at least surface *what's* failing next time, which will narrow things down further.
- Phase 11 (network/IP lockdown) remains separately, deliberately deferred.

**Next step:**
- Waiting on the user to test the updated APK and report what happens now — ideally on real Android TV hardware, but any feedback (including from the same sandbox) is useful given the new error-visibility overlay.
