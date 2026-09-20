# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-21 — Removed the fake mobile "fullscreen" overlay per user feedback
**Context:** user pushed back on the previous mobile fullscreen fix: "it should go to full screen like for real, it is now just completely covering the screen, it was actually fine before" — the CSS-only fallback I'd added just visually filled the viewport without hiding the browser's address bar/chrome, which isn't real fullscreen and felt worse than what was there before.

**Fix:** [src/components/player/VideoPlayer.tsx](../src/components/player/VideoPlayer.tsx) — removed the `pseudoFullscreen` CSS-overlay fallback entirely. The component now:
1. Feature-detects `document.fullscreenEnabled` once on mount (wrapped in `queueMicrotask` inside the effect to satisfy the `react-hooks/set-state-in-effect` lint rule, same pattern used elsewhere in this codebase).
2. Only renders the ⛶ fullscreen button (and its hint text next to the server switcher) when real fullscreen is actually available on that platform.
3. Where it's not available (iOS Safari, which has never supported `Element.requestFullscreen()` on arbitrary elements — only on native `<video>` tags, which we can't reach since it's inside VidSrc's cross-origin iframe), the button simply doesn't appear. Users there fall back to the VidSrc player's own native video controls, which handle `<video>`-level fullscreen using iOS's own built-in support — that's a WebKit feature operating on the actual video tag inside their page, unaffected by Same-Origin Policy the way our own `Element.requestFullscreen()` attempt was.

This is the honest option: offer a working, genuinely-better fullscreen control where we can actually deliver on it (desktop, Android Chrome), and get out of the way where we can't, rather than presenting something that looks like fullscreen but isn't.

**Verified locally:** confirmed the container element's class never switches to the old `fixed inset-0` covering style on any code path anymore — clicking the button now only ever attempts the real `requestFullscreen()` call (or does nothing if the button isn't even rendered because `canFullscreen` is false). `npm run lint` and `npm run build` clean.

**Not started yet:**
- Haven't pushed this fix to GitHub yet — about to.
- Would be good to get final confirmation from the user on their actual phone once deployed — specifically whether VidSrc's own player controls now give them real fullscreen on iOS (can't be verified from here either way, since it depends entirely on VidSrc's own page behavior).
- Phase 11 (network/IP lockdown) remains deliberately deferred.

**Next step:**
- Commit and push.
