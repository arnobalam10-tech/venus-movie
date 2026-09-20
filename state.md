# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

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
