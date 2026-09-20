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
- [x] Build `/login` page: sign-in + sign-up forms (dark, minimal, Venus branding), inline error states — [src/app/login/page.tsx](../src/app/login/page.tsx).
- [x] Wire Supabase Auth sign-in/sign-up/sign-out actions — [src/app/login/actions.ts](../src/app/login/actions.ts).
- [x] Next.js Proxy (formerly "middleware", renamed by Next.js 16): redirect unauthenticated requests to `/login` for all routes except `/login` and auth callbacks; API routes get a 401 JSON instead of a redirect — [src/proxy.ts](../src/proxy.ts). Migrated from `middleware.ts` to `proxy.ts` per the Next.js 16 deprecation notice.
- [x] Auth callback route handler (for Supabase email confirmation redirect) — [src/app/auth/callback/route.ts](../src/app/auth/callback/route.ts).
- [x] Manual test: signed up a real test account, confirmed the confirmation email flow correctly blocked login pre-confirmation, confirmed via SQL, logged in, verified protected home + protected API routes, signed out, verified redirect back to `/login`. All passed, no server errors.

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
- [x] **Verified live in browser**: Inception (`/movie/27205`) — Server 1 played real video content from vidsrc.to (with the ad overlay typical of free embed services, outside our control); Server 2 correctly triggered the friendly fallback UI when it failed to load; Server 3 loaded a blank page from the mirror itself, a known limitation documented below. Details, genres, cast all rendered correctly. `npm run build` production build succeeded.

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
- **Known limitation (documented, not a bug):** VidSrc mirrors are third-party and outside our control. Server 1 (vidsrc.to) is reliable. Server 2 correctly triggers our fallback when it errors. Server 3 (vidsrc.xyz) can return a blank-but-"loaded" page for some titles — cross-origin restrictions mean we can't inspect iframe content to distinguish "blank" from "still rendering," so our timeout/error-based detection can't catch every failure mode. This matches the PRD's accepted design (§6): swap domain, same path structure, no deeper mirror-specific handling in v1.

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

## Phase 10 — Deployment (in progress)
- [x] Initial commit created and **pushed to GitHub**: [github.com/arnobalam10-tech/venus-movie](https://github.com/arnobalam10-tech/venus-movie) (user provided the repo URL and explicitly asked for the push). `git log`/`git status` confirm a clean working tree; `.env.local` was never committed (gitignored).
- [ ] Connect the repo to Vercel and set env vars there (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TMDB_API_KEY`, `TMDB_READ_ACCESS_TOKEN`, `NEXT_PUBLIC_SITE_URL` set to the real production URL). **Still needs the user** — no `vercel` CLI in this environment, so this has to be done via the Vercel dashboard (Import Project → pick the GitHub repo) or from the user's own machine.
- [ ] After connecting, update `NEXT_PUBLIC_SITE_URL` (currently `http://localhost:3000`) to the real Vercel URL so Supabase's email-confirmation links point to production.
- [ ] Deploy, smoke-test production: login, browse, search, play a movie, play a TV episode, jump back in, admin panel.

## Phase 11 (Future / Not in v1) — Network Lockdown
- [ ] Enforce `allowed_ips` CIDR check in middleware (currently table exists but unused).
- [ ] "Access Denied — connect to our WiFi" screen.
- [ ] Decide IP management approach (manual Supabase dashboard vs admin page vs CIDR — revisit with user when this phase starts).
