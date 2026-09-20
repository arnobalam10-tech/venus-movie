# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-21 — Fixed fullscreen on mobile (iOS Safari can't fullscreen arbitrary elements)
**Context:** user confirmed the previous fullscreen fix worked on PC, then reported it still doesn't work on phone.

**Root cause:** iOS Safari has never supported `Element.requestFullscreen()` for arbitrary elements — only for native `<video>` tags, via a separate WebKit-specific API (`webkitEnterFullscreen()` on `HTMLVideoElement`). Our previous fix called `requestFullscreen()` on our own container `<div>`, which works fine on desktop and Android Chrome but is a long-standing, intentional Apple platform restriction on iPhone Safari. We also can't reach the actual `<video>` element to use the video-specific API instead, because it lives inside VidSrc's cross-origin iframe — Same-Origin Policy blocks any access to another origin's DOM, so there's no way to call the video-specific fullscreen method directly. This is a hard platform limitation, not something fixable by calling the API differently.

**Fix:** [src/components/player/VideoPlayer.tsx](../src/components/player/VideoPlayer.tsx) — `toggleFullscreen()` now:
1. Tries the real Fullscreen API first, with vendor-prefixed fallbacks (`webkitRequestFullscreen`, `mozRequestFullScreen`, `msRequestFullscreen`) for broader compatibility.
2. If unsupported (`document.fullscreenEnabled` false) or the call rejects, falls back to a CSS-only "pseudo-fullscreen" mode: the player container switches to `fixed inset-0 z-[100] bg-black`, visually filling the entire viewport. This needs no special browser permission, so it works everywhere, including iOS Safari.
3. Same ⛶ button and click handler drive both paths — the user never sees a difference except the label mechanism. Escape key also exits the CSS fallback mode; body scroll is locked while it's active.

**Verified end-to-end in this session** (an improvement over the PC-only fix, which I could only reason about via API inspection since the testing tool's pane doesn't support real fullscreen either way):
- Confirmed native `requestFullscreen()` rejects in this testing environment too (same as it would need to on iOS) — watched the code correctly catch that rejection and fall back to pseudo-fullscreen.
- Screenshotted the result at both desktop and 375px mobile width: player fills the entire screen, exit icon visible bottom-right, header/nav fully covered as expected.
- Confirmed exiting (clicking the button again) correctly reverts to the normal inline player at both sizes.
- `npm run lint` and `npm run build` clean.
- Updated `plan.md` (Phase 6 entry, appended to the existing fullscreen writeup) with the full root-cause and verification details.

**Not started yet:**
- Haven't pushed this fix to GitHub yet — about to.
- Would be good to get final confirmation from the user on their actual iPhone/Android once deployed.
- Phase 11 (network/IP lockdown) remains deliberately deferred.

**Next step:**
- Commit and push.
