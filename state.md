# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-21 — Added a reliable fullscreen button after diagnosing an ad-hijack on the VidSrc player
**Context:** user reported "full screen button not working in pc" — the fullscreen control inside the video player itself wasn't working.

**Investigation:**
- Loaded the movie page live and played the video. No visible custom control bar with a fullscreen icon appeared on hover in testing.
- Right-clicked inside the player to probe further — this triggered a **blocked popup redirect to `offer.alibaba.com`**. That's a well-known ad-hijacking pattern some free/ad-monetized streaming embeds use: intercepting clicks anywhere on the page (not just right-click) to fire popup/redirect ads instead of the actual intended action. This almost certainly explains why their own fullscreen button doesn't work reliably — a click meant for their fullscreen control very plausibly gets hijacked by the same ad script.
- This happens entirely inside VidSrc's cross-origin iframe content, which we have zero ability to inspect or modify (Same-Origin Policy) — not something fixable from our side directly.
- Checked our own side first, to rule out a real bug there: confirmed via the Permissions Policy API that our iframe correctly delegates the `fullscreen` feature (`allow="autoplay; encrypted-media; picture-in-picture; fullscreen"` + `allowFullScreen` were already both present and correctly recognized by the browser).

**Fix — added our own fullscreen control that never touches VidSrc's UI:**
- `src/components/player/VideoPlayer.tsx`: added a ⛶ button overlaid on the bottom-right of the player. It calls `requestFullscreen()` directly on our own container `<div>` (which wraps the iframe) from a genuine click on our own page — this fullscreens the whole player including whatever's inside the iframe, without ever needing to click anything inside VidSrc's own content. Toggles to an exit icon via the `fullscreenchange` event listener. Added a small hint text next to the server buttons ("Use the ⛶ button on the player for a reliable fullscreen.", hidden on mobile to save space) so users know it's there and why.
- Wrapped `requestFullscreen()`/`exitFullscreen()` calls in `.catch(() => {})` for resilience.

**Verification — hit a real limitation of the testing tool itself:**
- Clicking the new button in the automated browser tool didn't visibly enter fullscreen. Investigated directly: calling `requestFullscreen()` via the tool on our page returned `TypeError: Permissions check failed`.
- To rule out a bug in our code, tested the *exact same call* (`document.body.requestFullscreen()`) on a totally unrelated page (`example.com`, no iframe, nothing to do with our app) in the same browser pane — it failed with the identical error. This proves the restriction is in the testing tool's own embedded preview pane (which apparently doesn't have fullscreen permission itself, so nothing rendered inside it can use the Fullscreen API, regardless of what any page does), not something specific to our implementation.
- The code itself is the standard, MDN-documented Fullscreen API pattern and should work correctly in a real browser tab (which is what the user actually uses) — this could not be given a full green-light confirmation, only a strong logical one, since the tool itself can't verify it.
- `npm run lint` and `npm run build` both clean.
- Updated `plan.md` (Phase 6 entry) with the full investigation writeup, including the ad-hijack finding as a heads-up about the third-party embed's behavior.

**Not started yet:**
- Haven't pushed this fix to GitHub yet — about to.
- Would be good to get user confirmation once deployed that the new ⛶ button actually works for them, since this couldn't be end-to-end verified here.
- Phase 11 (network/IP lockdown) remains deliberately deferred.

**Next step:**
- Commit and push, then ask the user to confirm the fullscreen button works once live.
