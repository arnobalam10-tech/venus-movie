# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-21 — Planned TV casting feature (Android TV app + web pairing/cast), not yet built
**Context:** user asked about casting to an Android TV, similar to YouTube/Prime's "cast" experience, from both iOS Safari and Chrome. Worked through the scoping conversation with them:
- Explained real Google Cast is impossible from iOS Safari (Apple never implemented the sender API on iOS, and every iOS browser is forced onto WebKit underneath, so "Chrome on iPhone" doesn't get it either) — a hard platform wall, not an engineering gap.
- Explained our video isn't a URL we control (third-party VidSrc iframe), so even where Cast-the-protocol would technically work, there's no clean media URL to hand a receiver, and no programmatic control over VidSrc's player either way.
- Proposed the realistic alternative instead: a custom pairing + relay system built on our own stack (Supabase Realtime), which works identically from any browser since it never touches an OS-level cast API.
- User confirmed this direction, specifically described the exact pairing flow they want (TV shows code → phone enters it once → both show "Connected" persistently → "Cast to TV" button appears when browsing → casting something new just switches), asked about pause/play (flagged as uncertain — might work via Android system media-key routing reaching the WebView's active video even across the cross-origin iframe boundary, but no guarantee without building and testing it), then explicitly said to skip play/pause.
- User also asked for a "Download TV App" button linking directly to the APK on the `/login` page.

**Done this turn — planning only, no code written:**
- **PRD.md §13 (new)**: full spec for "TV Casting (Android TV App)" — why not real Cast, the pairing flow (replaces TV login entirely, no typed credentials on a remote), the casting flow, how the TV plays video without a full logged-in session (a narrow short-lived signed "view token" for a stripped-down `/tv-embed` route, rather than replicating cookie-based Supabase auth inside a WebView), the new `tv_devices` schema + RLS, and APK distribution as a static file with a direct-download button.
- **plan.md Phase 12 (new)**: step-by-step checklist split into web-side work (new DB table, `/api/tv/register` + `/api/tv/pair` + status route, the `/tv` pairing page, the view-token helper, `/tv-embed` routes, the "Cast to TV" button in `VideoPlayer.tsx`, APK hosting + login page download button) and Android-side work (new separate Kotlin/Android TV project — pairing screen, Realtime subscription, WebView cast target). Explicitly notes play/pause and real Google Cast as descoped, with the reasoning captured.
- Flagged as the first task before Android work starts: check what Android build tooling (SDK/Gradle/JDK) is actually available in this environment, since that determines how much of the native app I can build directly versus needing the user to build/test on their own machine — this is a materially different situation from the website, which I've been able to fully build and verify live in a browser.

**Not started yet:**
- No code written for this feature yet — this turn was planning only, per the user's explicit "go ahead and plan" (not "go ahead and build").
- Everything in Phase 12 of plan.md is still unchecked.
- Phase 11 (network/IP lockdown) remains separately, deliberately deferred (unrelated to this).

**Next step:**
- Waiting on the user to say go before starting Phase 12 implementation. When they do, the sensible first move is checking Android tooling availability, then building the web-side pieces first (they're the same stack as everything else and can be verified live), before starting the separate Android project.
