# Build Plan — Venus

Reference: [PRD.md](PRD.md) is the source of truth for scope/decisions. This file is the step-by-step execution plan. Steps are meant to be done roughly in order; check off (`[x]`) as completed, and mirror progress into `state.md` after every response.

---

## Phase 0 — Project Setup
- [x] Init git repo (created automatically by `create-next-app`).
- [x] Scaffold Next.js app (App Router, TypeScript, Tailwind CSS) at project root.
- [x] Install deps: `@supabase/supabase-js`, `@supabase/ssr`.
- [x] Set up `.env.local` (gitignored) with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` filled in. `TMDB_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` left blank pending user input.
- [x] Base Tailwind theme: dark mode default, "Venus" color palette/accent (pink/purple gradient).
- [x] Basic layout shell (header/nav with logo "Venus", search entry point) — [src/components/Header.tsx](../src/components/Header.tsx).

## Phase 1 — Supabase Setup
- [x] Create Supabase project — done via Supabase MCP connector, project "Venus" (`hnmnnbnxmnmvtsrgksjf`, ap-southeast-1, free tier).
- [x] Run SQL from PRD §5 to create `watch_history` table + RLS policies.
- [x] Run SQL from PRD §5 to create `allowed_ips` table + RLS policy (Phase 2 stub, unused in v1).
- [x] Configure Supabase Auth: Email/Password provider enabled (confirmed — default-on, verified via a real signup during Phase 2 testing).
- [x] Set up Supabase client helpers: browser client ([src/lib/supabase/client.ts](../src/lib/supabase/client.ts)), server client ([src/lib/supabase/server.ts](../src/lib/supabase/server.ts)), middleware client ([src/lib/supabase/middleware.ts](../src/lib/supabase/middleware.ts)).

## Phase 2 — Auth & Route Protection
- [x] Build `/login` page: **sign-in only** (dark, minimal, Venus branding), inline error states — [src/app/login/page.tsx](../src/app/login/page.tsx). Originally built with a sign-up toggle too; removed per a later product decision (§4 of PRD.md) — accounts are admin-provisioned only, no self-service signup.
- [x] Wire Supabase Auth sign-in/sign-out actions — [src/app/login/actions.ts](../src/app/login/actions.ts).
- [x] Next.js Proxy (formerly "middleware", renamed by Next.js 16): redirect unauthenticated requests to `/login` for all routes except `/login`; API routes get a 401 JSON instead of a redirect — [src/proxy.ts](../src/proxy.ts). Migrated from `middleware.ts` to `proxy.ts` per the Next.js 16 deprecation notice.
- [x] ~~Auth callback route handler~~ — built initially for the self-signup email-confirmation redirect, then **removed** (`src/app/auth/callback/`) once signup was removed; no longer needed since every account is created pre-confirmed via the admin panel.
- [x] Manual test: verified sign-in → redirect to `/` → protected home + protected API routes → sign-out → redirect back to `/login`. All passed, no server errors. (Original testing also covered the now-removed signup/email-confirmation flow, which worked correctly before being removed.)

## Phase 3 — TMDB Server Proxy Layer
- [x] `/api/genres/[mediaType]` route — fetch + cache TMDB genre list.
- [x] `/api/trending/[mediaType]` route — fetch + cache TMDB trending.
- [x] `/api/top-rated/[mediaType]` and `/api/new-releases/[mediaType]` routes (added for the PRD's "Top Rated"/"New Releases" home rows).
- [x] `/api/discover/[mediaType]` route — fetch + cache TMDB discover by genre.
- [x] `/api/search` route — TMDB multi-search (movies + TV), debounce-friendly.
- [x] `/api/details/[mediaType]/[id]` route — TMDB details + credits (append_to_response=credits).
- [x] Add revalidate/caching strategy per route (per PRD §6) — see [src/lib/tmdb.ts](../src/lib/tmdb.ts).
- [x] Manual test each route in isolation (verified in browser, authenticated): genres, trending, search, details all returned real TMDB data.

## Phase 4 — Home Page ✅ verified in browser
- [x] Hero section component (pulls a trending pick, large banner + play/info CTA) — [src/components/Hero.tsx](../src/components/Hero.tsx).
- [x] Horizontal scrolling row component (reusable for all rows) — [src/components/Row.tsx](../src/components/Row.tsx) + [PosterCard.tsx](../src/components/PosterCard.tsx).
- [x] "Jump Back In" row: queries `watch_history` for current user (latest 10), re-hydrates each via `getDetails` (direct server-side TMDB lib call, not a round-trip through `/api`) — [src/components/rows/JumpBackInRow.tsx](../src/components/rows/JumpBackInRow.tsx). Correctly hidden for users with no history (verified).
- [x] "Trending Now" row — uses TMDB's combined `/trending/all` endpoint (already mixed movie+tv, sorted by popularity) — [TrendingRow.tsx](../src/components/rows/TrendingRow.tsx).
- [x] "Top Rated" row — merges & interleaves movie + tv top-rated — [TopRatedRow.tsx](../src/components/rows/TopRatedRow.tsx).
- [x] "New Releases" row — merges & interleaves movie now_playing + tv on_the_air — [NewReleasesRow.tsx](../src/components/rows/NewReleasesRow.tsx).
- [x] Dynamic genre rows: fetches movie + tv genre lists, merges by name (so e.g. "Comedy" pulls both movies and TV; genres that only exist for one media type render movie-only or tv-only), one row per merged genre, each streamed independently via its own Suspense boundary — [GenreRows.tsx](../src/components/rows/GenreRows.tsx) + [GenreRow.tsx](../src/components/rows/GenreRow.tsx).
- [x] **"Top 10 Movies Today" / "Top 10 TV Shows Today"** rows added later per user request ("different sections of suggestions like netflix top 10") — TMDB daily trending sliced to 10, shown with large translucent rank numerals — [RankedPosterCard.tsx](../src/components/RankedPosterCard.tsx), [RankedRow.tsx](../src/components/RankedRow.tsx), [TopTenMoviesRow.tsx](../src/components/rows/TopTenMoviesRow.tsx), [TopTenShowsRow.tsx](../src/components/rows/TopTenShowsRow.tsx). Placed right after "Trending Now".
- [x] **Fixed laggy scrolling on the Top 10 rows** after user report. Two real issues found and fixed: (1) `PosterCard`'s `sizes` hint was tuned for the search grid (up to 45vw) but the Top 10 posters only render at ~110-130px, so the browser was fetching/decoding oversized images during scroll — added an optional `sizes` prop to `PosterCard.tsx`, passed a correctly-sized value from `RankedPosterCard.tsx` (confirmed via network log: image requests dropped from `w=384` to `w=256`). (2) Added `will-change: scroll-position` to the shared `.scrollbar-none` class as a speculative smoothness fix, which turned out to be a real anti-pattern here — applied globally across dozens of rows, it forces that many permanent GPU compositor layers (memory pressure, can worsen scroll performance) and, in testing, caused a rendering glitch where the Top 10 rows' content was present and correct in the DOM but didn't paint. Removed it; kept the safer `-webkit-overflow-scrolling: touch`, `overscroll-behavior-x: contain`, `scroll-behavior: smooth`. Re-verified both rows render and scroll correctly after the fix.
- [x] **Personalized greeting banner** added per user request — a fun, private touch for a small friend group with accounts on the site. [src/lib/greetings.ts](../src/lib/greetings.ts) holds a per-person list of inside-joke lines, keyed by matching a substring against the logged-in user's email (accounts have no display-name field, so this is the practical option without a schema change). [Greeting.tsx](../src/components/Greeting.tsx) picks one at random server-side on every home page render (so it naturally changes "every time they visit home", no client JS needed) and shows it in a thin bar at the very top, above the hero. Users whose email doesn't match anyone on the list see nothing. Verified live: signing in as the `moazzir`-matching test account showed a matching line and changed across reloads; signing in as `admin@admin.com` (unmatched) showed no banner at all.
- [x] **Added pending/loading feedback to Sign in and Sign out buttons** after user report that sign-in "feels unresponsive" — neither button had any visual feedback while its server action (network round-trip + redirect) was in flight. New reusable [SubmitButton.tsx](../src/components/SubmitButton.tsx) using React's `useFormStatus()` (must live in a child component of the `<form>`, which is why it's split out rather than inlined) shows a spinner + "Signing in.../Signing out..." and disables the button while pending. Wired into `src/app/login/page.tsx` and `src/components/Header.tsx`. Verified both flows still work end-to-end after the change (sign-in → correct role-based redirect, sign-out → back to `/login`); the pending frame itself is too fast to catch in a localhost screenshot, but will be visible on any real network latency, which is exactly the scenario reported.
- [x] Type badge on posters (Movie / TV) since rows interleave both — built into `PosterCard.tsx`.
- [x] Loading skeletons + empty/error states per row (per PRD §10) — [RowSkeleton.tsx](../src/components/RowSkeleton.tsx), [RowMessage.tsx](../src/components/RowMessage.tsx); each row is its own Suspense-wrapped server component so slow rows don't block the page.
- [x] Verified live in browser (authenticated): hero + all rows render real TMDB data, correct movie/TV interleaving and badges, no console or server errors. `next.config.ts` updated with `image.tmdb.org` remote pattern for `next/image`. `npx tsc --noEmit` clean.

## Phase 5 — Search Page ✅ verified in browser
- [x] `/search` page: input with 400ms debounce, calls `/api/search` — [src/app/search/page.tsx](../src/app/search/page.tsx) + [src/components/search/SearchClient.tsx](../src/components/search/SearchClient.tsx).
- [x] Results grid (movies + TV, type-tagged) — reuses `PosterCard` (refactored to be width-agnostic so it works both in horizontal rows and this grid; `Row.tsx` now supplies the fixed-width wrapper for the row use case).
- [x] Empty state ("no results"), loading state (skeleton grid), error state — all verified live: searched "batman" (mixed movie/TV results with posters), searched a nonsense string (correct "No results" message).
- [x] Bonus: migrated `src/middleware.ts` → `src/proxy.ts` (Next.js 16 renamed the file convention from "middleware" to "proxy"; functionally identical, just the new name/export) after noticing the deprecation warning in dev server logs during this phase's testing.

## Phase 6 — Movie Detail Page ✅ verified in browser
- [x] `/movie/[id]` page: fetches details via direct server-side `getDetails()` call (more efficient than round-tripping through `/api`) — [src/app/movie/[id]/page.tsx](../src/app/movie/[id]/page.tsx).
- [x] VidSrc iframe embed, Server 1 default (`vidsrc.to`) — [src/components/player/VideoPlayer.tsx](../src/components/player/VideoPlayer.tsx), domains from [src/lib/vidsrc.ts](../src/lib/vidsrc.ts).
- [x] Server switcher UI (Server 1/2/3 → vidsrc.to/.me/.xyz), swaps iframe src.
- [x] Iframe failure/timeout fallback UI ("Stream currently unavailable") — 12s load timeout + `onError` handler.
- [x] Below-the-fold info: title, synopsis, rating, year, runtime, genres, cast (with headshots).
- [x] On page load (authenticated), upserts `watch_history` row (`media_type='movie'`) — [src/lib/watchHistory.ts](../src/lib/watchHistory.ts).
- [x] **Added our own fullscreen button** after user report "full screen button not working in pc". Root cause investigated live: right-clicking inside the VidSrc iframe triggered a blocked popup redirect to an ad site (`offer.alibaba.com`) — a known ad-hijacking pattern free embed players use, which very likely also intercepts clicks on their own in-player fullscreen control. That's inside their cross-origin page, entirely outside our control. Confirmed our side was already correctly configured (the `fullscreen` Permissions Policy feature is present on the iframe via `allow`/`allowFullScreen`). Fix: added a dedicated ⛶ button overlaid on our player (bottom-right, `VideoPlayer.tsx`) that calls `requestFullscreen()` on our own container div from a genuine click on our own origin — bypasses whatever is happening inside VidSrc's UI entirely, since it never has to click anything inside their iframe. Toggles to an exit-fullscreen icon via the `fullscreenchange` event. User confirmed this fixed it on PC.
- [x] **Added a CSS "pseudo-fullscreen" fallback for mobile** after user follow-up: "fullscreen now works in pc but not in phone". Root cause: iOS Safari has never supported `Element.requestFullscreen()` on arbitrary elements — only on native `<video>` tags directly, via a separate WebKit-only API — and we can't reach the actual `<video>` element because it lives inside VidSrc's cross-origin iframe (Same-Origin Policy blocks any access to its contents). This is a hard platform restriction, not fixable by calling the API differently. Fix (initial): `toggleFullscreen()` tried the real Fullscreen API first, and fell back to a pure-CSS `fixed inset-0` mode that visually filled the viewport when unsupported.
- [x] **Removed the CSS fallback** after user feedback: "it should go to full screen like for real, it is now just completely covering the screen... it was actually fine before". Fair complaint — the CSS overlay never hid the browser's own address bar/chrome, so it wasn't real fullscreen, just a worse-feeling substitute. Since there's no honest way to deliver true fullscreen on iOS for this cross-origin video (explained above), faking it made the experience worse than not offering the button at all. Fix: `VideoPlayer.tsx` now feature-detects `document.fullscreenEnabled` once on mount and only renders the ⛶ button (and its hint text) when real fullscreen is actually available — on platforms without support, the button doesn't appear at all, and users fall back to the VidSrc player's own native video controls, which on iOS specifically handle `<video>`-level fullscreen natively regardless of what our page does (that's a WebKit built-in, not something Same-Origin Policy blocks). Verified locally that the container element never switches to the old covering class anymore, on any path.
- [x] **Verified live in browser**: Inception (`/movie/27205`) — Server 1 played real video content from vidsrc.to (with the ad overlay typical of free embed services, outside our control); Server 2 correctly triggered the friendly fallback UI when it failed to load; Server 3 loaded a blank page from the mirror itself, a known limitation documented below. Details, genres, cast all rendered correctly. `npm run build` production build succeeded.
- [x] **Default server swapped** per user feedback after real-world use ("server 2 is better") — [src/lib/vidsrc.ts](../src/lib/vidsrc.ts) reordered so `vidsrc.me` is now "Server 1" (default, loads with no ad overlay in testing) and `vidsrc.to` is "Server 2". Verified: default iframe src is now `vidsrc.me`, plays cleanly.

## Phase 7 — TV Show Pages ✅ verified in browser
- [x] `/tv/[id]` page: show overview + season/episode picker — [src/app/tv/[id]/page.tsx](../src/app/tv/[id]/page.tsx) + [src/components/tv/SeasonBrowser.tsx](../src/components/tv/SeasonBrowser.tsx). Added `getSeason()` to `tmdb.ts` and a supporting `/api/tv/[id]/season/[season]` route for client-side season switching.
- [x] `/tv/[id]/[season]/[episode]` page: VidSrc TV iframe + same server switcher + fallback UI — [src/app/tv/[id]/[season]/[episode]/page.tsx](../src/app/tv/[id]/[season]/[episode]/page.tsx).
- [x] Episode list/nav to jump between episodes within the page (Previous/Next, correctly disabled at season boundaries).
- [x] On episode page load (authenticated), upserts `watch_history` row (`media_type='tv'`, season/episode set).
- [x] "Jump Back In" for TV resumes to the exact last-watched episode link.
- [x] **Verified live in browser**: Breaking Bad (`/tv/1396`) — season switcher correctly fetched Season 2 episodes via the API route; clicked into 2x1, video played, Next correctly advanced to 2x2; returned to home and confirmed Jump Back In now shows both Breaking Bad (linking straight to `/tv/1396/2/2`, the exact resume point) and Inception (`/movie/27205`), most-recent-first.

## Phase 8 — Polish & Responsiveness ✅ verified in browser
- [x] Full responsive pass: tested home, movie detail, and search pages at 375×812 (mobile) — header collapses to Search/Sign out, hero/rows/player/cast all reflow correctly, no horizontal scroll or overlap.
- [x] Cross-check all error/empty/loading states across pages — done incrementally per phase (row-level skeletons/errors, search empty/error states, VidSrc fallback, custom `not-found.tsx` page for bad movie/TV IDs).
- [x] Verified no TMDB key or Supabase service role key reaches the client bundle — all TMDB/Supabase-admin calls are server-only (`lib/tmdb.ts`, route handlers, server components); `NEXT_PUBLIC_*` vars are the only ones exposed, by design.
- [x] Basic SEO/meta — root layout sets "Venus"; movie/tv/episode pages have `generateMetadata` for per-page titles (e.g. "Inception — Venus"); `not-found.tsx` added for graceful 404s.
- [x] `npm run lint` and `npx tsc --noEmit` both clean; `npm run build` production build succeeds with all routes compiling.
- **Known limitation (documented, not a bug):** VidSrc mirrors are third-party and outside our control. Server 1 (vidsrc.to) is reliable. Server 2 correctly triggers our fallback when it errors. Server 3 (vidsrc.xyz) can return a blank-but-"loaded" page for some titles — cross-origin restrictions mean we can't inspect iframe content to distinguish "blank" from "still rendering," so our timeout/error-based detection can't catch every failure mode. This matches the PRD's accepted design (§6): swap domain, same path structure, no deeper mirror-specific handling in v1. (Note: Server 1/2 domains were later swapped — see Phase 6 — this limitation note's server numbers are from when it was written and no longer match current labels.)
- **Mobile "not fitting / not sticky" report investigated (2026-09-21):** user reported mobile layout issues on the live site. Tested emulated viewports at 320px and 375px width across home, movie, TV, search, and admin pages — no horizontal overflow found anywhere (`document.documentElement.scrollWidth` matched viewport width on every page tested), viewport meta tag is correctly set, and `position: sticky` on the header was confirmed working via direct DOM inspection (header stayed pinned at `top: 0` through a 9975px scroll). Could not reproduce a concrete layout bug. As a safe improvement regardless, made the header more visually solid (`bg-background/95` + shadow, up from `/80`) so the sticky effect reads more clearly against busy hero imagery. If the issue persists, it may be device-specific or about the third-party VidSrc player's own embedded UI (outside our control) rather than our layout — flagged to the user to confirm with a screenshot or specific page/device if it recurs.

## Phase 9 — Admin Panel ✅ complete, verified end-to-end
Per user instruction: core app came first, admin panel was the final v1 feature before deployment.
- [x] Ran SQL to create `admin_users` table + locked-down RLS policy (PRD §9), via the Supabase connector.
- [x] Marked the test account as an admin (one-off SQL insert) for testing purposes.
- [x] User supplied `SUPABASE_SERVICE_ROLE_KEY` — added to `.env.local` (server-only, gitignored).
- [x] Server-side admin guard — [src/lib/admin.ts](../src/lib/admin.ts): checks `admin_users` via a service-role client (required, since RLS blocks that table entirely for anon/authenticated roles by design); returns `null` safely if the service role key isn't configured, rather than throwing.
- [x] `/admin` page: protected, redirects non-admins — [src/app/admin/page.tsx](../src/app/admin/page.tsx).
- [x] "Add user" form (email + password) → server action using `supabase.auth.admin.createUser` (service role, pre-confirmed) — [src/app/admin/actions.ts](../src/app/admin/actions.ts) + [AddUserForm.tsx](../src/components/admin/AddUserForm.tsx) (React 19 `useActionState`).
- [x] CSV import: file upload UI, server-side parse of `email,password` rows, per-row create via admin API, results summary table (created/skipped/failed + reasons) — [CsvImportForm.tsx](../src/components/admin/CsvImportForm.tsx).
- [x] Sample CSV download link — [public/sample-users.csv](../public/sample-users.csv).
- [x] Input validation (email regex, min 6-char password) and a 500-row upload cap before any rows are processed.
- [x] **Verified live end-to-end:** single-add created a real, pre-confirmed account (checked via SQL); re-submitting the same email correctly surfaced Supabase's "already registered" error; CSV import with a mixed batch (1 valid, 1 duplicate, 1 invalid email, 1 weak password) correctly created 1 and reported the other 3 with accurate reasons. **Bug found and fixed during this testing:** the duplicate-detection regex (`/already registered/i`) didn't match Supabase's actual wording ("already **been** registered"), so duplicates were miscategorized as "failed" instead of "skipped" — fixed to `/already.*registered/i` and re-verified. Test accounts created during testing were cleaned up from Supabase afterward.
- [x] Created the real admin login the user requested: `admin@admin.com` / `456852` (via the Supabase Auth Admin API directly, pre-confirmed) and granted it `/admin` access via `admin_users`. Verified it logs in and reaches `/admin` correctly.
- [x] **Self-signup removed entirely** (later product decision — only the admin creates accounts): removed the sign-up form/toggle from `/login`, the `signUp` server action, and the now-unused `/auth/callback` route handler; simplified the proxy's route checks accordingly. Verified sign-in still redirects to `/` correctly after the change.
- [x] **Users list** added to `/admin` — [src/components/admin/UsersList.tsx](../src/components/admin/UsersList.tsx): lists every account (email, created date, password when known). New `admin_created_credentials` table stores the plaintext password only for accounts created through this admin panel (single-add or CSV), since Supabase never exposes a password after signup for any account — a deliberate, explicit tradeoff the user chose over "emails only, no passwords". `addUser`/`importCsv` in `actions.ts` now write to this table on successful creation.
- [x] **Verified live:** signed in as `admin@admin.com` → `/admin` shows all 4 existing accounts, correctly showing the stored password for `admin@admin.com` (backfilled via SQL since that one was created before this table existed) and `—` for the two self-signup accounts created before signup was removed; added a new test user through the form and confirmed it appeared instantly in the list with its password (Server Action `revalidatePath` refreshing the list without a manual reload); cleaned up the test account afterward. `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean (had to clear a stale `.next` type-cache reference to the deleted callback route once).
- [x] **Admin routing fixed** after user feedback in production: sign-in always redirected to `/` regardless of role, and there was no visible way to reach `/admin` — the admin account "worked" but looked broken since nothing pointed to the admin panel. Fixed by making `signIn` (`src/app/login/actions.ts`) redirect admins straight to `/admin` (checked via new `isAdminUser()` helper in `src/lib/admin.ts`), adding a visible "Admin" link in `Header.tsx` when logged in as an admin, and making the proxy's "already logged in, visiting /login" redirect admin-aware too (`src/lib/supabase/middleware.ts`). Also revoked admin access from the `venustest` account, which had only been made admin for this session's own testing and isn't meant to be a real admin. Verified all three role-aware redirects live: admin sign-in → `/admin` directly, "Admin" link visible in header; regular account sign-in → `/` with no "Admin" link.

## Phase 10 — Deployment ✅ live
- [x] Initial commit created and **pushed to GitHub**: [github.com/arnobalam10-tech/venus-movie](https://github.com/arnobalam10-tech/venus-movie) (user provided the repo URL and explicitly asked for the push). `git log`/`git status` confirm a clean working tree; `.env.local` was never committed (gitignored).
- [x] User connected the repo to Vercel themselves and imported the `.env` file directly into the Vercel project settings. Live at **https://venus-movie.vercel.app**.
- [x] Production smoke test (done directly against the live URL): sign-in redirects correctly, home page renders real TMDB data (hero, Jump Back In, rows), `/admin` accessible and functional, sign-out works. Initial user report of "sign-in stuck" / "can't access admin" was diagnosed live and traced to (a) testing with a non-admin account against `/admin`, which was correctly blocked, and (b) admin sign-in landing on the homepage with no visible link to `/admin` — fixed by the admin-routing change above, not a deployment problem.
- [ ] `NEXT_PUBLIC_SITE_URL` is effectively unused now (it was only for the self-signup email-confirmation flow, which has been removed) — no action needed there.

## Phase 11 (Future / Not in v1) — Network Lockdown
- [ ] Enforce `allowed_ips` CIDR check in middleware (currently table exists but unused).
- [ ] "Access Denied — connect to our WiFi" screen.
- [ ] Decide IP management approach (manual Supabase dashboard vs admin page vs CIDR — revisit with user when this phase starts).

## Phase 12 — TV Casting (Android TV App) — planned, not yet built
Full design rationale in PRD.md §13. Custom pairing + relay system (not real Google Cast — iOS Safari can't support that, and our video isn't a URL we control anyway). No play/pause from phone (explicitly descoped). APK gets a direct-download button on `/login`.

**Web side (Next.js/Supabase):**
- [ ] Check Android build tooling available in this environment before starting the app side (Android SDK/Gradle/JDK) — determines how much of the Android build I can do directly vs. hand off.
- [ ] Migration: `tv_devices` table + RLS policy (PRD §13.5), via the Supabase connector.
- [ ] `POST /api/tv/register` — service-role route: TV calls this with nothing, server creates a pending row with a random `device_token` + 6-digit `pairing_code` (~10 min expiry), returns both to the TV.
- [ ] `POST /api/tv/pair` — authenticated route: takes `{ code }`, finds the matching pending row (not expired, not already paired), sets `user_id` + `paired_at`.
- [ ] `GET /api/tv/status` (or similar) — authenticated: does the current user have a paired device? Used by both the `/tv` page and the "Cast to TV" button to decide whether to show themselves.
- [ ] `/tv` page: shows "Connected" (with an unpair/forget option) if the user already has a paired device; otherwise a simple 6-digit code input that calls `/api/tv/pair`.
- [ ] Signed short-lived "view token" helper (HMAC, bound to a specific `device_token` + title, short expiry) — minted server-side when a cast message is sent, never exposed publicly.
- [ ] `/tv-embed/movie/[id]` and `/tv-embed/tv/[id]/[season]/[episode]` — stripped-down pages (no header/nav, just the VidSrc iframe), validate the signed view token instead of a full Supabase session.
- [ ] "Cast to TV" button in `VideoPlayer.tsx` (next to the fullscreen button), shown only when the signed-in user has a paired device. On click: mints a view token for the current title, publishes `{ mediaType, tmdbId, season?, episode?, viewToken }` on the paired device's Supabase Realtime channel.
- [ ] Host the compiled `.apk` as a static file (`public/venus-tv.apk`) once the Android side produces a build.
- [ ] "Download TV App" button on `/login`, linking directly to `/venus-tv.apk`.

**Android TV app (separate Kotlin project, own repo/folder):**
- [ ] New Android TV project scaffold (minimal Compose UI: code-display screen + "Connected" screen).
- [ ] On first launch (or if unpaired): call `/api/tv/register`, store `device_token` locally, display the pairing code.
- [ ] Subscribe to the device's Supabase Realtime channel; on the row flipping to paired, switch to the "Connected" screen; on every future launch, reconnect directly using the stored `device_token` (skip pairing screen if already paired).
- [ ] On receiving a cast message: load `/tv-embed/...` (with the supplied view token) full-screen in a WebView.
- [ ] Manual test end-to-end on real hardware (can't be verified from this side the way the website has been) — pairing, casting, switching titles while already casting.

**Not in scope (explicitly descoped):**
- [ ] ~~Play/pause/seek/volume control from the phone~~ — user said skip it.
- [ ] Real Google Cast / Chromecast protocol — not achievable from iOS Safari regardless of TV app design (see PRD §13.1).
